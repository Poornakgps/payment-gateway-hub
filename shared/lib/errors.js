// Error types and error handler for consistent error reporting
const express = require('express');

class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.code = options.code || 'INTERNAL_ERROR';
    this.details = options.details || null;
    this.originalError = options.originalError || null;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, {
      statusCode: 401,
      code: 'AUTHENTICATION_ERROR',
    });
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message, {
      statusCode: 403,
      code: 'AUTHORIZATION_ERROR',
    });
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }
}

class PaymentProcessingError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      statusCode: options.statusCode || 500,
      code: options.errorCode || 'PAYMENT_PROCESSING_ERROR',
      details: options.details || null,
      originalError: options.originalError || null,
    });
    
    this.provider = options.provider || null;
    this.transactionId = options.transactionId || null;
  }
}

// Express error handling middleware
const errorHandler = (err, req, res, next) => {
  const logger = require('./logger');
  
  // Set default values
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  
  // Log error details
  if (statusCode >= 500) {
    logger.error(`Error: ${message}`, {
      error: err,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    logger.warn(`Error: ${message}`, {
      error: err,
      url: req.originalUrl,
      method: req.method,
    });
  }
  
  // Create response
  const errorResponse = {
    error: true,
    code,
    message,
  };
  
  // Add details if available
  if (err.details) {
    errorResponse.details = err.details;
  }
  
  // Avoid exposing internal error details in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentProcessingError,
  errorHandler,
};