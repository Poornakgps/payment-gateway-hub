require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  // Payment service configuration
  paymentService: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://payment-core:3001/api',
    apiKey: process.env.INTERNAL_API_KEY || 'internal-api-key',
  },
  
  // Provider configuration
  providers: {
    stripe: {
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
    },
  },
  
  // Security
  security: {
    allowedIps: process.env.WEBHOOK_ALLOWED_IPS 
      ? process.env.WEBHOOK_ALLOWED_IPS.split(',')
      : [],
  }
};