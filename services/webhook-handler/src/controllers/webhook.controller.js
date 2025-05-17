const eventProcessor = require('../services/event-processor.service');
const signatureValidator = require('../utils/signature-validator');
const logger = require('../../../shared/lib/logger');

class WebhookController {
  async handleStripeWebhook(req, res) {
    let eventId = 'unknown';
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        logger.warn('Received Stripe webhook without signature header');
        // Still return 200 to prevent retries
        return res.status(200).json({ 
          received: true, 
          success: false, 
          error: 'Missing stripe-signature header' 
        });
      }

      const result = await signatureValidator.validateStripeSignature(signature, req.rawBody);
      eventId = result.event.id;
      
      // Process the event asynchronously
      // We don't await this to respond quickly to the webhook
      eventProcessor.processStripeEvent(result.event)
        .catch(error => {
          logger.error(`Async processing of Stripe event ${eventId} failed:`, error);
        });
      
      res.status(200).json({ 
        received: true,
        success: true,
        eventId: eventId
      });
    } catch (error) {
      logger.error(`Stripe webhook error (event: ${eventId}):`, error);
      
      // Always return 200 to prevent retries from Stripe
      res.status(200).json({ 
        received: true, 
        success: false, 
        error: error.message,
        eventId: eventId
      });
    }
  }

  async handlePayPalWebhook(req, res) {
    let eventId = 'unknown';
    try {
      const headers = {
        'paypal-auth-algo': req.headers['paypal-auth-algo'],
        'paypal-cert-url': req.headers['paypal-cert-url'],
        'paypal-transmission-id': req.headers['paypal-transmission-id'],
        'paypal-transmission-sig': req.headers['paypal-transmission-sig'],
        'paypal-transmission-time': req.headers['paypal-transmission-time']
      };
      
      // Check if required headers are present
      const requiredHeaders = [
        'paypal-transmission-id',
        'paypal-transmission-sig',
        'paypal-transmission-time'
      ];
      
      for (const header of requiredHeaders) {
        if (!req.headers[header]) {
          logger.warn(`Received PayPal webhook without ${header} header`);
          // Return 200 to prevent retries
          return res.status(200).json({ 
            received: true, 
            success: false, 
            error: `Missing ${header} header` 
          });
        }
      }
      
      const result = await signatureValidator.validatePayPalSignature(headers, req.body);
      eventId = result.event.id || result.event.event_id || 'unknown';
      
      // Process the event asynchronously
      eventProcessor.processPayPalEvent(result.event)
        .catch(error => {
          logger.error(`Async processing of PayPal event ${eventId} failed:`, error);
        });
      
      res.status(200).json({ 
        received: true,
        success: true,
        eventId: eventId 
      });
    } catch (error) {
      logger.error(`PayPal webhook error (event: ${eventId}):`, error);
      
      // Always return 200 to prevent retries from PayPal
      res.status(200).json({ 
        received: true, 
        success: false, 
        error: error.message,
        eventId: eventId
      });
    }
  }
}

module.exports = new WebhookController();