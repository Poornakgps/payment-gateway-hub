const config = require('../config');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');
const axios = require('axios');

class SignatureValidator {
  async validateStripeSignature(signature, payload) {
    try {
      // We'll use the payment core Stripe adapter for validation
      const response = await axios.post(
        `${config.paymentService.url}/providers/stripe/validate-webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.paymentService.apiKey,
            'stripe-signature': signature
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Stripe signature validation failed:', error);
      throw new PaymentProcessingError('Invalid webhook signature', {
        statusCode: 400,
        errorCode: 'INVALID_SIGNATURE'
      });
    }
  }

  async validatePayPalSignature(headers, payload) {
    try {
      // We'll use the payment core PayPal adapter for validation
      const response = await axios.post(
        `${config.paymentService.url}/providers/paypal/validate-webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.paymentService.apiKey,
            ...headers
          }
        }
      );
      
      return response.data;
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