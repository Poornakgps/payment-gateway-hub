const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError, AuthorizationError } = require('../../../shared/lib/errors');

/**
 * Admin authentication middleware that verifies admin JWT tokens
 */
function adminAuthMiddleware(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No authentication token provided');
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user has admin role
    if (!decoded.roles || !decoded.roles.includes('admin')) {
      throw new AuthorizationError('Admin access required');
    }
    
    // Add decoded token to request
    req.admin = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Authentication token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid authentication token');
    } else if (error instanceof AuthorizationError) {
      throw error;
    } else {
      throw new AuthenticationError('Authentication failed');
    }
  }
}

/**
 * API key authentication for internal service calls
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    throw new AuthenticationError('API key is required');
  }
  
  // In production, validate against stored API keys
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  const internalApiKey = config.paymentService.apiKey;
  
  if (!validApiKeys.includes(apiKey) && apiKey !== internalApiKey) {
    throw new AuthenticationError('Invalid API key');
  }
  
  next();
}

module.exports = {
  adminAuthMiddleware,
  apiKeyAuth
};