const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../../../shared/lib/logger');

// Create Redis client for rate limiting
const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

// Store for Redis rate limiting
const RedisStore = {
  // Increments the counter for a given key
  increment: async (key) => {
    try {
      const current = await redisClient.incr(key);
      await redisClient.expire(key, Math.floor(config.rateLimit.windowMs / 1000));
      return current;
    } catch (error) {
      logger.error('Rate limit Redis error:', error);
      return 1; // Allow request if Redis fails
    }
  },
  
  // Decrements the counter for a given key (useful for high-value operations)
  decrement: async (key) => {
    try {
      const current = await redisClient.decr(key);
      return Math.max(0, current);
    } catch (error) {
      logger.error('Rate limit Redis error:', error);
      return 0;
    }
  },
  
  // Resets the counter for a given key
  resetKey: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Rate limit Redis error:', error);
      return false;
    }
  },
};

// Standard rate limiter for most API endpoints
const standardLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key if present, otherwise use IP
    return req.headers['x-api-key'] || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
  skip: (req) => {
    // Skip rate limiting for certain routes or IPs if needed
    const whitelist = process.env.RATE_LIMIT_WHITELIST 
      ? process.env.RATE_LIMIT_WHITELIST.split(',') 
      : [];
    
    return whitelist.includes(req.ip);
  },
  store: {
    // Implement required methods using Redis
    increment: async (key) => {
      return await RedisStore.increment(key);
    },
    
    decrement: async (key) => {
      return await RedisStore.decrement(key);
    },
    
    resetKey: async (key) => {
      return await RedisStore.resetKey(key);
    },
    
    // The rate-limit library requires a synchronous resetAll method,
    // but we're using an async store, so this is a placeholder.
    // It's rarely needed in production environments.
    resetAll: () => {
      logger.warn('resetAll called on Redis rate limit store - not implemented');
      return true;
    },
  },
});

// More strict rate limiter for sensitive operations like payment creation
const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.floor(config.rateLimit.max / 2), // Half the standard limit
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: 'Too many payment requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
  store: {
    increment: async (key) => {
      return await RedisStore.increment(`strict:${key}`);
    },
    
    decrement: async (key) => {
      return await RedisStore.decrement(`strict:${key}`);
    },
    
    resetKey: async (key) => {
      return await RedisStore.resetKey(`strict:${key}`);
    },
    
    resetAll: () => {
      logger.warn('resetAll called on Redis rate limit store - not implemented');
      return true;
    },
  },
});

module.exports = {
  standardLimiter,
  strictLimiter,
};