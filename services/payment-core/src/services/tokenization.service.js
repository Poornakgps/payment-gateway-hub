const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../../../shared/lib/logger');

class TokenizationService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });
    
    // Generate a new key on start if not in production
    if (config.nodeEnv !== 'production') {
      this.secretKey = crypto.randomBytes(32); // 256 bits
    } else {
      // In production, use a consistent key from environment
      this.secretKey = Buffer.from(process.env.TOKENIZATION_KEY || '', 'hex');
      if (this.secretKey.length === 0) {
        // If no key specified, generate one and log it (should be set properly in production)
        this.secretKey = crypto.randomBytes(32);
        logger.warn(`No tokenization key found. Generated key: ${this.secretKey.toString('hex')}`);
      }
    }
  }

  async tokenizePaymentMethod(paymentData) {
    // Create a unique token ID
    const tokenId = uuidv4();
    
    try {
      // Convert payment data to string
      const paymentDataString = JSON.stringify(paymentData);
      
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(paymentDataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Store encrypted data with metadata
      const tokenData = {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        tokenId,
        createdAt: new Date().toISOString(),
        // Store a masked/truncated version of the card number for display purposes
        maskedData: this._createMaskedData(paymentData),
      };
      
      // Save in Redis with expiration (default: 1 year)
      const expirationTime = 60 * 60 * 24 * 365; // 1 year in seconds
      await this.redis.set(`token:${tokenId}`, JSON.stringify(tokenData), 'EX', expirationTime);
      
      // Return the token ID and masked data
      return {
        tokenId,
        maskedData: tokenData.maskedData,
      };
    } catch (error) {
      logger.error('Error tokenizing payment method:', error);
      throw new Error('Failed to tokenize payment method');
    }
  }

  async detokenizePaymentMethod(tokenId) {
    try {
      // Retrieve token data from Redis
      const tokenDataString = await this.redis.get(`token:${tokenId}`);
      
      if (!tokenDataString) {
        throw new Error('Token not found or expired');
      }
      
      const tokenData = JSON.parse(tokenDataString);
      
      // Extract encryption components
      const { encryptedData, iv, authTag } = tokenData;
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(iv, 'hex')
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse and return the payment data
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Error detokenizing payment method:', error);
      throw new Error('Failed to detokenize payment method');
    }
  }

  async deleteToken(tokenId) {
    try {
      // Delete token from Redis
      await this.redis.del(`token:${tokenId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting token:', error);
      throw new Error('Failed to delete token');
    }
  }

  _createMaskedData(paymentData) {
    const maskedData = {};
    
    // Handle credit card data
    if (paymentData.cardNumber) {
      // Store only last 4 digits
      maskedData.cardNumber = `**** **** **** ${paymentData.cardNumber.slice(-4)}`;
      
      // Store card type/brand if available
      if (paymentData.cardType) {
        maskedData.cardType = paymentData.cardType;
      }
      
      // Store expiry month/year
      if (paymentData.expiryMonth && paymentData.expiryYear) {
        maskedData.expiryDate = `${paymentData.expiryMonth}/${paymentData.expiryYear}`;
      }
      
      // Store cardholder name (first initial and last name)
      if (paymentData.cardholderName) {
        const nameParts = paymentData.cardholderName.split(' ');
        if (nameParts.length > 1) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          maskedData.cardholderName = `${firstName.charAt(0)}. ${lastName}`;
        } else {
          maskedData.cardholderName = paymentData.cardholderName;
        }
      }
    }
    
    // Handle PayPal data
    if (paymentData.paypalEmail) {
      // Mask email (show only first 2 chars and domain)
      const [username, domain] = paymentData.paypalEmail.split('@');
      maskedData.paypalEmail = `${username.substring(0, 2)}***@${domain}`;
    }
    
    // Include payment type
    maskedData.type = paymentData.type || 'card';
    
    return maskedData;
  }
}

module.exports = new TokenizationService();