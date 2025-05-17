require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration (for reading transaction data)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'payment_gateway',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  // Redis configuration (for caching reports)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    reportCacheTTL: parseInt(process.env.REPORT_CACHE_TTL || '3600', 10), // 1 hour default
  },
  
  // JWT configuration for admin authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'admin-reports-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  
  // Payment service API for fetching transaction data
  paymentService: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://payment-core:3001/api',
    apiKey: process.env.INTERNAL_API_KEY || 'internal-api-key',
  },
  
  // Report generation limits
  reports: {
    maxTimeRangeInDays: parseInt(process.env.MAX_TIME_RANGE_DAYS || '366', 10), // ~1 year
    maxItemsPerReport: parseInt(process.env.MAX_ITEMS_PER_REPORT || '5000', 10),
  }
};