const express = require('express');
const paymentController = require('../controllers/payment.controller');
const providerController = require('../controllers/provider.controller');
const { authMiddleware, apiKeyAuth } = require('../middleware/auth.middleware');
const { standardLimiter, strictLimiter } = require('../middleware/rate-limit.middleware');
const router = express.Router();

// Apply rate limiting to all routes
router.use(standardLimiter);

// Create a new payment
router.post(
  '/',
  strictLimiter,
  apiKeyAuth,
  asyncHandler(paymentController.createPayment)
);

// Confirm a payment
router.post(
  '/:transactionId/confirm',
  strictLimiter,
  apiKeyAuth,
  asyncHandler(paymentController.confirmPayment)
);

// Get payment details
router.get(
  '/:transactionId',
  apiKeyAuth,
  asyncHandler(paymentController.getPayment)
);

// Refund a payment
router.post(
  '/:transactionId/refund',
  strictLimiter,
  apiKeyAuth,
  asyncHandler(paymentController.refundPayment)
);

// Get list of transactions with filtering
router.get(
  '/',
  apiKeyAuth,
  asyncHandler(paymentController.getTransactions)
);

// Tokenize a payment method
router.post(
  '/tokens',
  strictLimiter,
  apiKeyAuth,
  asyncHandler(paymentController.tokenizePaymentMethod)
);

// Delete a token
router.delete(
  '/tokens/:tokenId',
  apiKeyAuth,
  asyncHandler(paymentController.deleteToken)
);

// Get a provider session (for client initialization)
router.post(
  '/sessions/:provider',
  apiKeyAuth,
  asyncHandler(paymentController.getProviderSession)
);

// Find transaction by provider transaction ID
router.get(
  '/provider/:providerTransactionId',
  apiKeyAuth,
  asyncHandler(paymentController.getTransactionByProviderId)
);

// Update transaction status
router.post(
  '/:transactionId/status',
  apiKeyAuth,
  asyncHandler(paymentController.updateTransactionStatus)
);

// Record dispute for transaction
router.post(
  '/:transactionId/dispute',
  apiKeyAuth,
  asyncHandler(paymentController.recordDispute)
);

// Provider-specific webhook validation endpoints
router.post(
  '/providers/stripe/validate-webhook',
  apiKeyAuth,
  express.raw({ type: 'application/json' }),
  asyncHandler(providerController.validateStripeWebhook)
);

router.post(
  '/providers/paypal/validate-webhook',
  apiKeyAuth,
  asyncHandler(providerController.validatePayPalWebhook)
);

// Utility function to handle async controller functions
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = router;