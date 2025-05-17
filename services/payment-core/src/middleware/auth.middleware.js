const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError } = require('../../../shared/lib/errors');

/**
 * Authentication middleware for verifying JWT tokens
 */
function authMiddleware(req, res, next) {
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
    
    // Add decoded token to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Authentication token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid authentication token');
    } else {
      throw new AuthenticationError('Authentication failed');
    }
  }
}

/**
 * Optional authentication middleware that doesn't require authentication
 * but will add user info to req if a valid token is provided
 */
function optionalAuthMiddleware(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  // If no token, continue without authentication
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add decoded token to request
    req.user = decoded;
  } catch (error) {
    // Ignore errors, just continue without authentication
  }
  
  next();
}

/**
 * Middleware for checking specific role permissions
 * @param {string|string[]} requiredRoles - Required role(s) to access the route
 */
function roleCheck(requiredRoles) {
  return (req, res, next) => {
    // Check if user exists and has been authenticated
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Convert to array if string
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has one of the required roles
    if (!roles.some(role => req.user.roles && req.user.roles.includes(role))) {
      throw new AuthenticationError('Insufficient permissions');
    }
    
    next();
  };
}

/**
 * API key authentication middleware
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    throw new AuthenticationError('API key is required');
  }
  
  // In a real implementation, you would validate the API key against a database
  // This is a simplified version for demonstration purposes
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  if (!validApiKeys.includes(apiKey)) {
    throw new AuthenticationError('Invalid API key');
  }
  
  // Add API key info to request
  req.apiKey = apiKey;
  
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  roleCheck,
  apiKeyAuth,
};