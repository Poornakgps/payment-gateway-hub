const Joi = require('joi');
const { ValidationError } = require('../../../shared/lib/errors');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');

// Schema for creating a new payment transaction
const createTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.precision': 'Amount cannot have more than 2 decimal places',
      'any.required': 'Amount is required'
    }),
  
  currency: Joi.string().length(3).uppercase().default('USD')
    .messages({
      'string.length': 'Currency must be a 3-letter ISO code',
      'string.uppercase': 'Currency must be uppercase'
    }),
  
  provider: Joi.string().valid(...Object.values(PAYMENT_PROVIDERS)).required()
    .messages({
      'any.only': 'Provider must be one of: ' + Object.values(PAYMENT_PROVIDERS).join(', '),
      'any.required': 'Provider is required'
    }),
  
  paymentMethod: Joi.string().required()
    .messages({
      'any.required': 'Payment method is required'
    }),
  
  description: Joi.string().max(255)
    .messages({
      'string.max': 'Description cannot exceed 255 characters'
    }),
  
  metadata: Joi.object(),
  
  customerId: Joi.string(),
  
  customerEmail: Joi.string().email()
    .messages({
      'string.email': 'Customer email must be a valid email'
    }),
  
  billingAddress: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().length(2).uppercase().required(),
  }),
  
  shippingAddress: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().length(2).uppercase().required(),
  }),
  
  returnUrl: Joi.string().uri().when('provider', {
    is: PAYMENT_PROVIDERS.PAYPAL,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  cancelUrl: Joi.string().uri().when('provider', {
    is: PAYMENT_PROVIDERS.PAYPAL,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().integer().positive().required(),
      price: Joi.number().positive().precision(2).required(),
    })
  ),
});

// Schema for confirming a transaction
const confirmTransactionSchema = Joi.object({
  paymentIntentId: Joi.string(),
  paypalOrderId: Joi.string(),
  paymentMethod: Joi.string(),
});

// Schema for refunding a transaction
const refundTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2)
    .messages({
      'number.positive': 'Refund amount must be positive',
      'number.precision': 'Refund amount cannot have more than 2 decimal places'
    }),
  
  reason: Joi.string().max(255),
});

// Schema for tokenizing payment method
const tokenizePaymentMethodSchema = Joi.object({
  type: Joi.string().valid('card', 'paypal', 'bank_account').required(),
  
  // Card details
  cardNumber: Joi.string().creditCard().when('type', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  cardholderName: Joi.string().when('type', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  expiryMonth: Joi.string().min(1).max(2).pattern(/^[0-9]+$/).when('type', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  expiryYear: Joi.string().min(2).max(4).pattern(/^[0-9]+$/).when('type', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  cvv: Joi.string().min(3).max(4).pattern(/^[0-9]+$/).when('type', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  // PayPal details
  paypalEmail: Joi.string().email().when('type', {
    is: 'paypal',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  // Bank account details
  accountNumber: Joi.string().when('type', {
    is: 'bank_account',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  routingNumber: Joi.string().when('type', {
    is: 'bank_account',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  accountHolderName: Joi.string().when('type', {
    is: 'bank_account',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  
  accountType: Joi.string().valid('checking', 'savings').when('type', {
    is: 'bank_account',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
});

// Schema for filtering transactions
const transactionFilterSchema = Joi.object({
  status: Joi.string().valid(
    'initiated', 
    'processing', 
    'completed', 
    'failed', 
    'refunded', 
    'partially_refunded',
    'canceled'
  ),
  
  provider: Joi.string().valid(...Object.values(PAYMENT_PROVIDERS)),
  
  customerId: Joi.string(),
  
  fromDate: Joi.date(),
  
  toDate: Joi.date().greater(Joi.ref('fromDate')),
  
  page: Joi.number().integer().min(1).default(1),
  
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Generic validator function
function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    
    throw new ValidationError('Validation failed', details);
  }
  
  return value;
}

module.exports = {
  validateCreateTransaction: (data) => validate(createTransactionSchema, data),
  validateConfirmTransaction: (data) => validate(confirmTransactionSchema, data),
  validateRefundTransaction: (data) => validate(refundTransactionSchema, data),
  validateTokenizePaymentMethod: (data) => validate(tokenizePaymentMethodSchema, data),
  validateTransactionFilters: (data) => validate(transactionFilterSchema, data),
};