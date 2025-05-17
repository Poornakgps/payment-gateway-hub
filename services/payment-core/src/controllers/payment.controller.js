const transactionService = require('../services/transaction.service');
const tokenizationService = require('../services/tokenization.service');
const { validateCreateTransaction, validateRefundTransaction, 
        validateTokenizePaymentMethod } = require('../utils/validation');
const logger = require('../../../shared/lib/logger');

class PaymentController {
  async createPayment(req, res) {
    // Validate request body
    const paymentData = validateCreateTransaction(req.body);
    
    // Create transaction
    const result = await transactionService.createTransaction(paymentData);
    
    res.status(201).json(result);
  }

  async confirmPayment(req, res) {
    const { transactionId } = req.params;
    
    // Confirm the transaction
    const result = await transactionService.confirmTransaction(transactionId, req.body);
    
    res.status(200).json(result);
  }

  async getPayment(req, res) {
    const { transactionId } = req.params;
    
    // Get transaction details
    const transaction = await transactionService.getTransactionById(transactionId);
    
    res.status(200).json(transaction);
  }

  async refundPayment(req, res) {
    const { transactionId } = req.params;
    const refundData = validateRefundTransaction(req.body);
    
    // Process refund
    const result = await transactionService.refundTransaction(transactionId, refundData.amount);
    
    res.status(200).json(result);
  }

  async getTransactions(req, res) {
    // Extract filter parameters
    const filters = {
      status: req.query.status,
      provider: req.query.provider,
      customerId: req.query.customerId,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    };
    
    // Extract pagination parameters
    const pagination = {
      page: parseInt(req.query.page || '1', 10),
      limit: parseInt(req.query.limit || '10', 10),
    };
    
    // Get transactions with filters
    const result = await transactionService.getTransactions(filters, pagination);
    
    res.status(200).json(result);
  }

  async tokenizePaymentMethod(req, res) {
    // Validate request body
    const paymentMethodData = validateTokenizePaymentMethod(req.body);
    
    // Tokenize payment method
    const token = await tokenizationService.tokenizePaymentMethod(paymentMethodData);
    
    res.status(201).json(token);
  }

  async deleteToken(req, res) {
    const { tokenId } = req.params;
    
    // Delete token
    await tokenizationService.deleteToken(tokenId);
    
    res.status(204).send();
  }

  async getProviderSession(req, res) {
    const { provider } = req.params;
    
    try {
      // This would integrate with provider SDKs to create client sessions
      // For example, with Stripe, this could create a SetupIntent or PaymentIntent
      
      // Implementation would depend on the provider
      // For now, return a simple mock response
      res.status(200).json({
        sessionId: `mock-session-${Date.now()}`,
        provider,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error creating provider session:', error);
      throw error;
    }
  }

  // NEW METHODS for webhook handler integration

  async getTransactionByProviderId(req, res) {
    const { providerTransactionId } = req.params;
    
    // Get transaction by provider transaction ID
    const transaction = await transactionService.getTransactionByProviderId(providerTransactionId);
    
    res.status(200).json(transaction);
  }

  async updateTransactionStatus(req, res) {
    const { transactionId } = req.params;
    const { status, ...metadata } = req.body;
    
    // Update transaction status
    const transaction = await transactionService.updateTransactionStatus(transactionId, status, metadata);
    
    res.status(200).json(transaction);
  }

  async recordDispute(req, res) {
    const { transactionId } = req.params;
    const { status, disputeReason, disputeAmount, metadata } = req.body;
    
    try {
      // Find the transaction
      const transaction = await transactionService.getTransactionById(transactionId);
      
      // Update transaction with dispute information
      await transaction.update({
        status: 'disputed',
        metadata: {
          ...transaction.metadata,
          dispute: {
            reason: disputeReason,
            amount: disputeAmount,
            createdAt: new Date().toISOString(),
            ...metadata
          }
        }
      });
      
      res.status(200).json({
        transactionId,
        status: 'disputed',
        disputeReason,
        disputeAmount
      });
    } catch (error) {
      logger.error(`Error recording dispute for transaction ${transactionId}:`, error);
      throw error;
    }
  }
}

module.exports = new PaymentController();