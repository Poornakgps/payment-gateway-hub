const crypto = require('crypto');
const config = require('../config');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

class SignatureValidator {
  // Validate Stripe signature directly
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

  // Implement proper PayPal signature validation
  async validatePayPalSignature(headers, payload) {
    try {
      // Required headers for validation
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionTime = headers['paypal-transmission-time'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const webhookId = config.providers.paypal.webhookId;
      
      if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
        throw new Error('Missing required PayPal headers');
      }
      
      if (!webhookId) {
        throw new Error('PayPal webhook ID is not configured');
      }
      
      // Verify the certificate URL is from PayPal
      if (!this._isValidPayPalCertUrl(certUrl)) {
        throw new Error('Invalid PayPal certificate URL');
      }
      
      // 1. Get the PayPal certificate
      const certificate = await this._getPayPalCertificate(certUrl);
      
      // 2. Construct the validation string
      const validationStr = `${transmissionId}|${transmissionTime}|${webhookId}|${this._sha256(JSON.stringify(payload))}`;
      
      // 3. Verify the signature
      const isValid = this._verifyPayPalSignature(
        transmissionSig,
        validationStr,
        certificate,
        authAlgo
      );
      
      if (!isValid) {
        throw new Error('PayPal signature validation failed');
      }
      
      return { event: payload };
    } catch (error) {
      logger.error('PayPal signature validation failed:', error);
      throw new PaymentProcessingError('Invalid webhook signature', {
        statusCode: 400,
        errorCode: 'INVALID_SIGNATURE'
      });
    }
  }
  
  // Helper method to calculate SHA-256 hash
  _sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  // Helper method to verify PayPal certificate URL
  _isValidPayPalCertUrl(url) {
    // Ensure the certificate comes from PayPal
    return url.startsWith('https://api.paypal.com/') || 
           url.startsWith('https://api.sandbox.paypal.com/');
  }
  
  // Helper method to retrieve PayPal certificate
  async _getPayPalCertificate(certUrl) {
    try {
      const response = await axios.get(certUrl);
      return response.data;
    } catch (error) {
      logger.error('Error retrieving PayPal certificate:', error);
      throw new Error('Failed to retrieve PayPal certificate');
    }
  }
  
  // Helper method to verify PayPal signature
  _verifyPayPalSignature(signature, data, certificate, algorithm) {
    try {
      // Convert algorithm to a format that crypto understands
      // PayPal uses 'SHA256withRSA' which translates to 'RSA-SHA256' in node
      const cryptoAlgo = algorithm === 'SHA256withRSA' ? 'RSA-SHA256' : algorithm;
      
      // Verify the signature
      const verify = crypto.createVerify(cryptoAlgo);
      verify.update(data);
      
      return verify.verify(certificate, signature, 'base64');
    } catch (error) {
      logger.error('Error verifying PayPal signature:', error);
      return false;
    }
  }
}

module.exports = new SignatureValidator();