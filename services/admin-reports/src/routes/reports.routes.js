const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { adminAuthMiddleware, apiKeyAuth } = require('../middleware/admin-auth.middleware');
const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

// Transaction volume report
router.get(
  '/volume',
  asyncHandler(reportsController.getTransactionVolume)
);

// Provider distribution report
router.get(
  '/providers',
  asyncHandler(reportsController.getProviderDistribution)
);

// Success rates report
router.get(
  '/success-rates',
  asyncHandler(reportsController.getSuccessRates)
);

// Revenue report
router.get(
  '/revenue',
  asyncHandler(reportsController.getRevenueReport)
);

// Utility function for async error handling
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = router;