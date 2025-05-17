const crypto = require('crypto');
const config = require('../config');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SignatureValidator {
  // Validate Stripe signature directly instead of calling payment core service
  async validateStripeSignature(signature, payload) {
    try {
      const webhookSecret = config.providers.stripe.webhookSecret;
      
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }
      
      // Construct and verify the event
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          payload, 
          signature, 
          webhookSecret
        );
      } catch (err) {
        logger.error('Stripe signature validation error:', err);
        throw new PaymentProcessingError('Invalid Stripe webhook signature', {
          statusCode: 400,
          errorCode: 'INVALID_SIGNATURE'
        });
      }
      
      return { event };
    } catch (error) {
      logger.error('Stripe signature validation failed:', error);
      throw new PaymentProcessingError('Invalid webhook signature', {
        statusCode: 400,
        errorCode: 'INVALID_SIGNATURE'
      });
    }
  }

  // PayPal validation is more complex and would typically involve 
  // verifying the certificate and signature. For simplicity in this example,
  // we'll assume the event is valid for PayPal webhooks
  async validatePayPalSignature(headers, payload) {
    try {
      // In a real implementation, you would validate the PayPal webhook signature
      // This would typically involve verifying the certificate and signature
      // For simplicity, we're assuming it's valid
      
      return { event: payload };
    } catch (error) {
      logger.error('PayPal signature validation failed:', error);
      throw new PaymentProcessingError('Invalid webhook signature', {
        statusCode: 400,
        errorCode: 'INVALID_SIGNATURE'
      });
    }
  }
}

module.exports = new SignatureValidator();