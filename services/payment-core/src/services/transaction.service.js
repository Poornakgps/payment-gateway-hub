const Transaction = require('../models/transaction.model');
const stripeAdapter = require('../adapters/stripe.adapter');
const paypalAdapter = require('../adapters/paypal.adapter');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');
const retryService = require('./retry.service');

class TransactionService {
  getProviderAdapter(provider) {
    switch (provider) {
      case PAYMENT_PROVIDERS.STRIPE:
        return stripeAdapter;
      case PAYMENT_PROVIDERS.PAYPAL:
        return paypalAdapter;
      default:
        throw new PaymentProcessingError(`Unsupported payment provider: ${provider}`);
    }
  }

  async createTransaction(transactionData) {
    try {
      // Create transaction record in pending state
      const transaction = await Transaction.create({
        ...transactionData,
        status: 'initiated',
      });

      // Get the appropriate provider adapter
      const adapter = this.getProviderAdapter(transaction.provider);

      // Process payment with provider
      const paymentResult = await adapter.createPaymentIntent(transactionData);

      // Update transaction with provider response
      await transaction.update({
        providerTransactionId: paymentResult.providerTransactionId,
        status: paymentResult.status,
        metadata: {
          ...transaction.metadata,
          providerResponse: paymentResult.metadata,
          clientSecret: paymentResult.clientSecret
        },
      });

      return {
        transactionId: transaction.id,
        status: transaction.status,
        providerTransactionId: transaction.providerTransactionId,
        clientSecret: paymentResult.clientSecret,
        approvalUrl: paymentResult.approvalUrl, // For PayPal
        requiresAction: paymentResult.status === 'processing',
      };
    } catch (error) {
      logger.error('Error creating transaction:', error);
      
      // If we have a transaction ID, update the transaction with error info
      if (error.transactionId) {
        await Transaction.update(
          {
            status: 'failed',
            errorMessage: error.message,
            errorCode: error.errorCode || 'UNKNOWN_ERROR',
          },
          { where: { id: error.transactionId } }
        );
      }
      
      throw error;
    }
  }

  async confirmTransaction(transactionId, paymentData = {}) {
    try {
      // Find the transaction
      const transaction = await Transaction.findByPk(transactionId);
      
      if (!transaction) {
        throw new PaymentProcessingError('Transaction not found');
      }
      
      // Get the appropriate provider adapter
      const adapter = this.getProviderAdapter(transaction.provider);
      
      let paymentResult;
      
      // Handle different providers
      if (transaction.provider === PAYMENT_PROVIDERS.STRIPE) {
        paymentResult = await adapter.capturePaymentIntent(transaction.providerTransactionId);
      } else if (transaction.provider === PAYMENT_PROVIDERS.PAYPAL) {
        paymentResult = await adapter.captureOrder(transaction.providerTransactionId);
      }
      
      // Update transaction with confirmed status
      await transaction.update({
        status: paymentResult.status,
        metadata: {
          ...transaction.metadata,
          confirmationResponse: paymentResult.metadata,
        },
        completedAt: paymentResult.status === 'completed' ? new Date() : null,
      });
      
      return {
        transactionId: transaction.id,
        status: transaction.status,
        providerTransactionId: transaction.providerTransactionId,
      };
    } catch (error) {
      logger.error('Error confirming transaction:', error);
      
      // If we have a transaction ID, update it with error info
      if (transactionId) {
        await Transaction.update(
          {
            errorMessage: error.message,
            errorCode: error.errorCode || 'UNKNOWN_ERROR',
          },
          { where: { id: transactionId } }
        );
        
        // Add to retry queue if appropriate
        const transaction = await Transaction.findByPk(transactionId);
        if (transaction && transaction.status !== 'failed') {
          await retryService.scheduleRetry(transaction);
        }
      }
      
      throw error;
    }
  }

  async getTransactionById(transactionId) {
    const transaction = await Transaction.findByPk(transactionId);
    
    if (!transaction) {
      throw new PaymentProcessingError('Transaction not found');
    }
    
    return transaction;
  }

  async getTransactionByProviderId(providerTransactionId) {
    const transaction = await Transaction.findOne({
      where: { providerTransactionId },
    });
    
    if (!transaction) {
      throw new PaymentProcessingError('Transaction not found');
    }
    
    return transaction;
  }

  async refundTransaction(transactionId, amount = null) {
    try {
      // Find the transaction
      const transaction = await Transaction.findByPk(transactionId);
      
      if (!transaction) {
        throw new PaymentProcessingError('Transaction not found');
      }
      
      // Validate transaction status
      if (transaction.status !== 'completed') {
        throw new PaymentProcessingError('Cannot refund a transaction that is not completed');
      }
      
      // Get the appropriate provider adapter
      const adapter = this.getProviderAdapter(transaction.provider);
      
      // Process refund with provider
      const refundResult = await adapter.refundPayment(
        transaction.providerTransactionId,
        amount || null
      );
      
      // Calculate refunded amount
      const totalRefundedAmount = (transaction.refundedAmount || 0) + refundResult.amount;
      
      // Determine new status (partially_refunded or refunded)
      const newStatus = totalRefundedAmount < transaction.amount ? 'partially_refunded' : 'refunded';
      
      // Update transaction
      await transaction.update({
        status: newStatus,
        refundedAmount: totalRefundedAmount,
        metadata: {
          ...transaction.metadata,
          refunds: [
            ...(transaction.metadata?.refunds || []),
            refundResult.metadata,
          ],
        },
      });
      
      return {
        transactionId: transaction.id,
        status: transaction.status,
        refundId: refundResult.refundId,
        refundedAmount: totalRefundedAmount,
      };
    } catch (error) {
      logger.error('Error refunding transaction:', error);
      throw error;
    }
  }

  async getTransactions(filters = {}, pagination = { page: 1, limit: 10 }) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.provider) where.provider = filters.provider;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.fromDate) where.createdAt = { [Op.gte]: new Date(filters.fromDate) };
    if (filters.toDate) {
      if (where.createdAt) {
        where.createdAt[Op.lte] = new Date(filters.toDate);
      } else {
        where.createdAt = { [Op.lte]: new Date(filters.toDate) };
      }
    }
    
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    return {
      transactions: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async updateTransactionStatus(transactionId, status, metadata = {}) {
    const transaction = await Transaction.findByPk(transactionId);
    
    if (!transaction) {
      throw new PaymentProcessingError('Transaction not found');
    }
    
    await transaction.update({
      status,
      metadata: {
        ...transaction.metadata,
        ...metadata,
      },
      completedAt: status === 'completed' ? new Date() : transaction.completedAt,
    });
    
    return transaction;
  }
}

module.exports = new TransactionService();