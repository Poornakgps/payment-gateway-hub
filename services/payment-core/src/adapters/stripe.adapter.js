const Stripe = require('stripe');
const config = require('../config');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');

class StripeAdapter {
  constructor() {
    this.stripe = new Stripe(config.providers.stripe.secretKey, {
      apiVersion: config.providers.stripe.apiVersion,
    });
    this.provider = PAYMENT_PROVIDERS.STRIPE;
  }

  async createPaymentIntent(paymentData) {
    try {
      const { amount, currency, paymentMethod, description, metadata, customerId } = paymentData;
      
      const paymentIntentParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description,
        metadata,
        payment_method_types: ['card'],
      };

      // If a saved payment method is provided
      if (paymentMethod) {
        paymentIntentParams.payment_method = paymentMethod;
        paymentIntentParams.confirm = true;
      }

      // If customer ID is provided
      if (customerId) {
        paymentIntentParams.customer = customerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);
      
      return {
        providerTransactionId: paymentIntent.id,
        status: this.mapPaymentStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new PaymentProcessingError('Failed to create payment with Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async capturePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);
      
      return {
        providerTransactionId: paymentIntent.id,
        status: this.mapPaymentStatus(paymentIntent.status),
        metadata: paymentIntent,
      };
    } catch (error) {
      logger.error('Stripe payment intent capture failed:', error);
      throw new PaymentProcessingError('Failed to capture payment with Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
      };

      // If amount is provided, add it to the refund parameters
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);
      
      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100, // Convert from cents
        metadata: refund,
      };
    } catch (error) {
      logger.error('Stripe refund failed:', error);
      throw new PaymentProcessingError('Failed to refund payment with Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async getPaymentDetails(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        providerTransactionId: paymentIntent.id,
        status: this.mapPaymentStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        metadata: paymentIntent,
      };
    } catch (error) {
      logger.error('Stripe payment intent retrieval failed:', error);
      throw new PaymentProcessingError('Failed to retrieve payment details from Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async createCustomer(customerData) {
    try {
      const { email, name, description, phone, address, metadata } = customerData;
      
      const customer = await this.stripe.customers.create({
        email,
        name,
        description,
        phone,
        address,
        metadata,
      });
      
      return {
        customerId: customer.id,
        metadata: customer,
      };
    } catch (error) {
      logger.error('Stripe customer creation failed:', error);
      throw new PaymentProcessingError('Failed to create customer with Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async createPaymentMethod(paymentMethodData) {
    try {
      const { type, card, billingDetails, metadata, customerId } = paymentMethodData;
      
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: type || 'card',
        card,
        billing_details: billingDetails,
        metadata,
      });
      
      // If a customer ID is provided, attach the payment method to the customer
      if (customerId) {
        await this.stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customerId,
        });
      }
      
      return {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        metadata: paymentMethod,
      };
    } catch (error) {
      logger.error('Stripe payment method creation failed:', error);
      throw new PaymentProcessingError('Failed to create payment method with Stripe', {
        originalError: error,
        provider: this.provider,
        errorCode: error.code,
      });
    }
  }

  async webhookHandler(signature, payload) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.providers.stripe.webhookSecret
      );
      
      return {
        event,
        eventType: event.type,
      };
    } catch (error) {
      logger.error('Stripe webhook validation failed:', error);
      throw new PaymentProcessingError('Failed to validate Stripe webhook', {
        originalError: error,
        provider: this.provider,
      });
    }
  }

  mapPaymentStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'initiated',
      'requires_confirmation': 'initiated',
      'requires_action': 'processing',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'completed',
      'canceled': 'canceled',
    };
    
    return statusMap[stripeStatus] || 'failed';
  }
}

module.exports = new StripeAdapter();