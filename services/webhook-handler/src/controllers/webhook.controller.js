const eventProcessor = require('../services/event-processor.service');
const signatureValidator = require('../utils/signature-validator');
const logger = require('../../../shared/lib/logger');

class WebhookController {
  async handleStripeWebhook(req, res) {
    try {
      const signature = req.headers['stripe-signature'];
      const result = await signatureValidator.validateStripeSignature(signature, req.rawBody);
      await eventProcessor.processStripeEvent(result.event);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook processing error:', error);
      // Still return 200 to prevent retries - we'll handle internally
      res.status(200).json({ received: true, error: error.message });
    }
  }

  async handlePayPalWebhook(req, res) {
    try {
      const headers = {
        'paypal-auth-algo': req.headers['paypal-auth-algo'],
        'paypal-cert-url': req.headers['paypal-cert-url'],
        'paypal-transmission-id': req.headers['paypal-transmission-id'],
        'paypal-transmission-sig': req.headers['paypal-transmission-sig'],
        'paypal-transmission-time': req.headers['paypal-transmission-time']
      };
      
      const result = await signatureValidator.validatePayPalSignature(headers, req.body);
      await eventProcessor.processPayPalEvent(result.event);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('PayPal webhook processing error:', error);
      res.status(200).json({ received: true, error: error.message });
    }
  }
}

module.exports = new WebhookController();