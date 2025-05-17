require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'payment_gateway',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Payment providers
  providers: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      apiVersion: '2023-10-16',
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    },
  },
  
  // Retry configuration
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000', 10),
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
  },
};