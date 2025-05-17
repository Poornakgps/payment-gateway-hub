const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const verificationMiddleware = require('../middleware/verification.middleware');
const router = express.Router();

// Apply IP validation for all routes in production
if (process.env.NODE_ENV === 'production') {
  router.use(verificationMiddleware.validateIpAllowlist);
}

// Apply raw body parser for Stripe webhook
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  verificationMiddleware.prepareStripeWebhook,
  asyncHandler(webhookController.handleStripeWebhook)
);

// Use JSON parser for PayPal webhook
router.post(
  '/paypal',
  express.json(),
  verificationMiddleware.parseJsonBody,
  asyncHandler(webhookController.handlePayPalWebhook)
);

// Utility function for async error handling
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = router;