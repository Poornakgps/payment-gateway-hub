const stripeAdapter = require('../adapters/stripe.adapter');
const paypalAdapter = require('../adapters/paypal.adapter');
const logger = require('../../../shared/lib/logger');

class ProviderController {
  async validateStripeWebhook(req, res) {
    try {
      const signature = req.headers['stripe-signature'];
      const result = await stripeAdapter.webhookHandler(signature, req.body);
      
      res.status(200).json({
        valid: true,
        event: result.event
      });
    } catch (error) {
      logger.error('Stripe webhook validation failed:', error);
      res.status(400).json({
        valid: false,
        error: error.message
      });
    }
  }

  async validatePayPalWebhook(req, res) {
    try {
      const headers = {
        'paypal-auth-algo': req.headers['paypal-auth-algo'],
        'paypal-cert-url': req.headers['paypal-cert-url'],
        'paypal-transmission-id': req.headers['paypal-transmission-id'],
        'paypal-transmission-sig': req.headers['paypal-transmission-sig'],
        'paypal-transmission-time': req.headers['paypal-transmission-time']
      };
      
      const result = await paypalAdapter.webhookHandler(headers, req.body);
      
      res.status(200).json({
        valid: true,
        event: result.event
      });
    } catch (error) {
      logger.error('PayPal webhook validation failed:', error);
      res.status(400).json({
        valid: false,
        error: error.message
      });
    }
  }
}

module.exports = new ProviderController();