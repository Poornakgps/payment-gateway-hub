const Redis = require('ioredis');
const config = require('../config');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');
const logger = require('../../../shared/lib/logger');
const axios = require('axios');
const Decimal = require('decimal.js');

class EventProcessorService {
  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });

    this.paymentServiceUrl = config.paymentService.url;
    this.paymentServiceApiKey = config.paymentService.apiKey;
    
    // Start the retry processing
    this.startRetryProcessing();
  }

  // Check if event has already been processed
  async hasProcessedEvent(provider, eventId) {
    const key = `webhook:${provider}:${eventId}`;
    return await this.redis.exists(key) === 1;
  }
  
  // Mark event as being processed - with a lock expiration
  async markEventProcessing(provider, eventId) {
    const key = `webhook:${provider}:${eventId}`;
    const processingKey = `webhook:processing:${provider}:${eventId}`;
    
    // Set a lock with expiration (5 minutes)
    await this.redis.set(processingKey, 'processing', 'EX', 300);
  }
  
  // Release processing lock if we need to
  async releaseProcessingLock(provider, eventId) {
    const processingKey = `webhook:processing:${provider}:${eventId}`;
    await this.redis.del(processingKey);
  }

  async processStripeEvent(event) {
    const eventId = event.id;
    const provider = PAYMENT_PROVIDERS.STRIPE;
    
    try {
      // Double-check if this event has already been processed
      // This handles the case where processing might have started in a different request
      const processed = await this.hasProcessedEvent(provider, eventId);
      if (processed) {
        logger.info(`Stripe event ${eventId} already processed, skipping`);
        return;
      }

      logger.info(`Processing Stripe event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this._handlePaymentSuccess(provider, event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this._handlePaymentFailure(provider, event.data.object);
          break;
        case 'charge.refunded':
          await this._handleRefund(provider, event.data.object);
          break;
        case 'charge.dispute.created':
          await this._handleDispute(provider, event.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      // Mark event as processed
      await this._markEventProcessed(provider, eventId);
    } catch (error) {
      logger.error(`Error processing Stripe event ${eventId}:`, error);
      // Store failed event for retry
      await this._storeFailedEvent(provider, event);
      throw error;
    } finally {
      // Always clean up the processing lock
      await this.releaseProcessingLock(provider, eventId);
    }
  }

  async processPayPalEvent(event) {
    const eventId = event.id || event.event_id;
    const provider = PAYMENT_PROVIDERS.PAYPAL;
    
    try {
      // Double-check if already processed
      const processed = await this.hasProcessedEvent(provider, eventId);
      if (processed) {
        logger.info(`PayPal event ${eventId} already processed, skipping`);
        return;
      }

      logger.info(`Processing PayPal event: ${event.event_type}`);

      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this._handlePaymentSuccess(provider, event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this._handlePaymentFailure(provider, event.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this._handleRefund(provider, event.resource);
          break;
        default:
          logger.info(`Unhandled PayPal event type: ${event.event_type}`);
      }

      // Mark event as processed
      await this._markEventProcessed(provider, eventId);
    } catch (error) {
      logger.error(`Error processing PayPal event ${eventId}:`, error);
      // Store failed event for retry
      await this._storeFailedEvent(provider, event);
      throw error;
    } finally {
      // Always clean up the processing lock
      await this.releaseProcessingLock(provider, eventId);
    }
  }

  async _handlePaymentSuccess(provider, data) {
    try {
      const transactionId = await this._getTransactionId(provider, data.id);
      
      if (!transactionId) {
        logger.warn(`No transaction found for provider ID: ${data.id}`);
        return;
      }

      await this._updateTransactionStatus(transactionId, 'completed', {
        providerEventData: data
      });

      logger.info(`Successfully updated transaction ${transactionId} to completed`);
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  async _handlePaymentFailure(provider, data) {
    try {
      const transactionId = await this._getTransactionId(provider, data.id);
      
      if (!transactionId) {
        logger.warn(`No transaction found for provider ID: ${data.id}`);
        return;
      }

      await this._updateTransactionStatus(transactionId, 'failed', {
        errorMessage: this._extractErrorMessage(provider, data),
        providerEventData: data
      });

      logger.info(`Updated transaction ${transactionId} to failed`);
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  async _handleRefund(provider, data) {
    try {
      let paymentId;
      
      if (provider === PAYMENT_PROVIDERS.STRIPE) {
        paymentId = data.payment_intent;
      } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
        paymentId = data.id;
      } else {
        throw new Error(`Unsupported provider for refund: ${provider}`);
      }
      
      if (!paymentId) {
        logger.warn(`Missing payment ID in refund data for provider: ${provider}`);
        return;
      }
      
      const transactionId = await this._getTransactionId(provider, paymentId);
      
      if (!transactionId) {
        logger.warn(`No transaction found for provider ID: ${paymentId}`);
        return;
      }

      const refundAmount = this._extractRefundAmount(provider, data);
      const isFullRefund = await this._isFullRefund(transactionId, refundAmount);

      await this._updateTransactionStatus(
        transactionId, 
        isFullRefund ? 'refunded' : 'partially_refunded', 
        {
          refundedAmount: refundAmount,
          providerEventData: data
        }
      );

      logger.info(`Updated transaction ${transactionId} refund status`);
    } catch (error) {
      logger.error('Error handling refund:', error);
      throw error;
    }
  }

  async _handleDispute(provider, data) {
    try {
      let paymentId;
      
      if (provider === PAYMENT_PROVIDERS.STRIPE) {
        paymentId = data.payment_intent;
      } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
        paymentId = data.id;
      } else {
        throw new Error(`Unsupported provider for dispute: ${provider}`);
      }
      
      if (!paymentId) {
        logger.warn(`Missing payment ID in dispute data for provider: ${provider}`);
        return;
      }
      
      const transactionId = await this._getTransactionId(provider, paymentId);
      
      if (!transactionId) {
        logger.warn(`No transaction found for provider ID: ${paymentId}`);
        return;
      }

      await axios.post(`${this.paymentServiceUrl}/payments/${transactionId}/dispute`, {
        status: 'disputed',
        disputeReason: this._extractDisputeReason(provider, data),
        disputeAmount: this._extractDisputeAmount(provider, data),
        metadata: {
          providerEventData: data
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.paymentServiceApiKey
        }
      });

      logger.info(`Created dispute record for transaction ${transactionId}`);
    } catch (error) {
      logger.error('Error handling dispute:', error);
      throw error;
    }
  }

  async _getTransactionId(provider, providerTransactionId) {
    try {
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments/provider/${providerTransactionId}`, 
        {
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      return response.data?.id;
    } catch (error) {
      logger.error(`Error finding transaction for provider ID ${providerTransactionId}:`, error);
      return null;
    }
  }

  async _updateTransactionStatus(transactionId, status, metadata = {}) {
    await axios.post(
      `${this.paymentServiceUrl}/payments/${transactionId}/status`, 
      {
        status,
        ...metadata
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.paymentServiceApiKey
        }
      }
    );
  }

  async _checkEventProcessed(provider, eventId) {
    const key = `webhook:${provider}:${eventId}`;
    return await this.redis.exists(key) === 1;
  }

  async _markEventProcessed(provider, eventId) {
    const key = `webhook:${provider}:${eventId}`;
    await this.redis.set(key, 'processed');
    await this.redis.expire(key, 60 * 60 * 24 * 30); // 30 days TTL
    
    // Clean up the processing key as well
    const processingKey = `webhook:processing:${provider}:${eventId}`;
    await this.redis.del(processingKey);
  }

  async _storeFailedEvent(provider, event) {
    const key = `webhook:failed:${provider}:${event.id || Date.now()}`;
    await this.redis.set(key, JSON.stringify(event));
    await this.redis.expire(key, 60 * 60 * 24 * 7); // 7 days TTL
  }

  _extractErrorMessage(provider, data) {
    if (provider === PAYMENT_PROVIDERS.STRIPE) {
      return data.last_payment_error?.message || 'Payment failed';
    } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
      return data.status_details?.reason || 'Payment failed';
    }
    return 'Payment failed';
  }

  _extractRefundAmount(provider, data) {
    if (provider === PAYMENT_PROVIDERS.STRIPE) {
      return data.amount_refunded / 100; // Convert from cents
    } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
      return parseFloat(data.amount.value);
    }
    throw new Error(`Unable to extract refund amount for provider: ${provider}`);
  }
  
  _extractDisputeReason(provider, data) {
    if (provider === PAYMENT_PROVIDERS.STRIPE) {
      return data.reason || 'unknown';
    } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
      return data.dispute_reason || 'unknown';
    }
    return 'unknown';
  }
  
  _extractDisputeAmount(provider, data) {
    if (provider === PAYMENT_PROVIDERS.STRIPE) {
      return data.amount / 100; // Convert from cents
    } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
      return parseFloat(data.dispute_amount?.value || data.amount.value);
    }
    throw new Error(`Unable to extract dispute amount for provider: ${provider}`);
  }

  async _isFullRefund(transactionId, refundAmount) {
    try {
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments/${transactionId}`, 
        {
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      const transaction = response.data;
      
      // Using Decimal.js for precise decimal arithmetic
      const transactionAmount = new Decimal(transaction.amount);
      const refundAmountDecimal = new Decimal(refundAmount);
      
      // Check if difference is less than 0.01
      return transactionAmount.minus(refundAmountDecimal).abs().lessThan(0.01);
    } catch (error) {
      logger.error(`Error determining if refund is full for transaction ${transactionId}:`, error);
      return false;
    }
  }

  // Retry processing for failed events
  async startRetryProcessing(intervalMs = 300000) { // Default: process every 5 minutes
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    this.retryInterval = setInterval(async () => {
      await this.processFailedEvents();
    }, intervalMs);
    
    logger.info(`Webhook retry processing started with interval of ${intervalMs}ms`);
  }
  
  async stopRetryProcessing() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      logger.info('Webhook retry processing stopped');
    }
  }
  
  async processFailedEvents() {
    try {
      // Get all failed event keys
      const keys = await this.redis.keys('webhook:failed:*');
      
      if (keys.length === 0) {
        return;
      }
      
      logger.info(`Processing ${keys.length} failed webhook events`);
      
      for (const key of keys) {
        try {
          // Extract provider and attempt to process
          const keyParts = key.split(':');
          const provider = keyParts[2];
          
          // Get event data
          const eventData = await this.redis.get(key);
          const event = JSON.parse(eventData);
          
          // Process based on provider
          if (provider === PAYMENT_PROVIDERS.STRIPE) {
            await this.processStripeEvent(event);
          } else if (provider === PAYMENT_PROVIDERS.PAYPAL) {
            await this.processPayPalEvent(event);
          }
          
          // Delete key on successful processing
          await this.redis.del(key);
          
          logger.info(`Successfully processed failed event: ${key}`);
        } catch (error) {
          logger.error(`Error processing failed event ${key}:`, error);
          // We don't delete the key, so it will be retried next time
        }
      }
    } catch (error) {
      logger.error('Error in webhook retry processing:', error);
    }
  }
}

module.exports = new EventProcessorService();