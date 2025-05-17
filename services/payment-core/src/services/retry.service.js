const { Op } = require('sequelize');
const config = require('../config');
const logger = require('../../../shared/lib/logger');

class RetryService {
  async scheduleRetry(transaction) {
    try {
      // Get retry configuration
      const { maxAttempts, initialDelay, maxDelay } = config.retry;
      
      // Check if maximum retry attempts reached
      if (transaction.retryCount >= maxAttempts) {
        await transaction.update({
          status: 'failed',
          errorMessage: `Exceeded maximum retry attempts (${maxAttempts})`,
        });
        return;
      }
      
      // Calculate exponential backoff delay
      const delay = Math.min(
        initialDelay * Math.pow(2, transaction.retryCount),
        maxDelay
      );
      
      // Set next retry time
      const nextRetryAt = new Date(Date.now() + delay);
      
      // Update transaction with retry information
      await transaction.update({
        retryCount: transaction.retryCount + 1,
        nextRetryAt,
      });
      
      logger.info(`Scheduled retry for transaction ${transaction.id}. Attempt ${transaction.retryCount + 1} at ${nextRetryAt}`);
    } catch (error) {
      logger.error('Error scheduling retry:', error);
    }
  }

  async processRetries() {
    try {
      const Transaction = require('../models/transaction.model');
      const transactionService = require('./transaction.service');
      
      // Find transactions due for retry
      const transactions = await Transaction.findAll({
        where: {
          status: { [Op.in]: ['initiated', 'processing'] },
          nextRetryAt: { [Op.lte]: new Date() },
          retryCount: { [Op.gt]: 0 },
        },
        limit: 50, // Process in batches
      });
      
      logger.info(`Processing ${transactions.length} transactions for retry`);
      
      // Process each transaction
      for (const transaction of transactions) {
        try {
          // Attempt to confirm the transaction
          await transactionService.confirmTransaction(transaction.id);
          
          logger.info(`Retry successful for transaction ${transaction.id}`);
        } catch (error) {
          logger.error(`Retry failed for transaction ${transaction.id}:`, error);
          
          // Schedule next retry if not exceeding max attempts
          if (transaction.retryCount < config.retry.maxAttempts) {
            await this.scheduleRetry(transaction);
          } else {
            // Mark as failed if max attempts reached
            await transaction.update({
              status: 'failed',
              errorMessage: `Failed after ${config.retry.maxAttempts} retry attempts: ${error.message}`,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error processing retries:', error);
    }
  }

  // Method to initialize retry processing interval
  startRetryProcessing(intervalMs = 60000) { // Default: process every minute
    // Clear any existing interval
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    // Set up interval for processing retries
    this.retryInterval = setInterval(() => this.processRetries(), intervalMs);
    
    logger.info(`Retry processing started with interval of ${intervalMs}ms`);
    
    return this.retryInterval;
  }

  stopRetryProcessing() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      logger.info('Retry processing stopped');
    }
  }
}

module.exports = new RetryService();