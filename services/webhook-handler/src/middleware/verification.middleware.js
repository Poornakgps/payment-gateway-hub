const config = require('../config');
const logger = require('../../../shared/lib/logger');

class VerificationMiddleware {
  /**
   * Middleware to prepare the request for Stripe webhook signature verification
   */
  prepareStripeWebhook(req, res, next) {
    // Store raw body for signature verification
    req.rawBody = req.body;
    
    // Convert buffer to JSON for controller
    try {
      if (req.body instanceof Buffer) {
        const rawBody = req.body;
        req.body = JSON.parse(rawBody.toString('utf8'));
      }
      next();
    } catch (error) {
      logger.error('Failed to parse webhook payload:', error);
      res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  /**
   * Middleware to parse JSON body for other providers
   */
  parseJsonBody(req, res, next) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (error) {
        logger.error('Failed to parse webhook payload:', error);
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }
    next();
  }

  /**
   * IP allowlist validation for added security in production
   */
  validateIpAllowlist(req, res, next) {
    const allowedIps = config.security.allowedIps;
    
    // Skip check if no IPs configured
    if (allowedIps.length === 0) {
      return next();
    }
    
    const clientIp = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress;
    
    if (allowedIps.includes(clientIp)) {
      next();
    } else {
      logger.warn(`Webhook request from unauthorized IP: ${clientIp}`);
      res.status(403).json({ error: 'Unauthorized IP address' });
    }
  }
}

module.exports = new VerificationMiddleware();