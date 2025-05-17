const paypal = require('@paypal/checkout-server-sdk');
const config = require('../config');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');
const { PaymentProcessingError } = require('../../../shared/lib/errors');
const logger = require('../../../shared/lib/logger');

class PayPalAdapter {
  constructor() {
    this.environment = this._getEnvironment();
    this.client = new paypal.core.PayPalHttpClient(this.environment);
    this.provider = PAYMENT_PROVIDERS.PAYPAL;
  }

  _getEnvironment() {
    if (config.providers.paypal.environment === 'production') {
      return new paypal.core.LiveEnvironment(
        config.providers.paypal.clientId,
        config.providers.paypal.clientSecret
      );
    }
    return new paypal.core.SandboxEnvironment(
      config.providers.paypal.clientId,
      config.providers.paypal.clientSecret
    );
  }

  async createOrder(paymentData) {
    try {
      const { amount, currency, description, items, returnUrl, cancelUrl } = paymentData;
      
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency || 'USD',
              value: amount.toString(),
              breakdown: {
                item_total: {
                  currency_code: currency || 'USD',
                  value: amount.toString()
                }
              }
            },
            description,
            items: items || [
              {
                name: description || 'Purchase',
                quantity: '1',
                unit_amount: {
                  currency_code: currency || 'USD',
                  value: amount.toString()
                }
              }
            ]
          }
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'Payment Gateway Hub',
          user_action: 'PAY_NOW',
        }
      };
      
      request.requestBody(orderPayload);
      
      const response = await this.client.execute(request);
      
      return {
        providerTransactionId: response.result.id,
        status: this.mapPaymentStatus(response.result.status),
        approvalUrl: this._getApprovalUrl(response.result.links),
        metadata: response.result,
      };
    } catch (error) {
      logger.error('PayPal order creation failed:', error);
      throw new PaymentProcessingError('Failed to create order with PayPal', {
        originalError: error,
        provider: this.provider,
        errorCode: error.statusCode,
      });
    }
  }

  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.prefer('return=representation');
      
      const response = await this.client.execute(request);
      
      return {
        providerTransactionId: response.result.id,
        status: this.mapPaymentStatus(response.result.status),
        metadata: response.result,
      };
    } catch (error) {
      logger.error('PayPal order capture failed:', error);
      throw new PaymentProcessingError('Failed to capture order with PayPal', {
        originalError: error,
        provider: this.provider,
        errorCode: error.statusCode,
      });
    }
  }

  async getOrderDetails(orderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      
      const response = await this.client.execute(request);
      
      const amount = response.result.purchase_units[0].amount.value;
      const currency = response.result.purchase_units[0].amount.currency_code;
      
      return {
        providerTransactionId: response.result.id,
        status: this.mapPaymentStatus(response.result.status),
        amount: parseFloat(amount),
        currency: currency,
        metadata: response.result,
      };
    } catch (error) {
      logger.error('PayPal order details retrieval failed:', error);
      throw new PaymentProcessingError('Failed to retrieve order details from PayPal', {
        originalError: error,
        provider: this.provider,
        errorCode: error.statusCode,
      });
    }
  }

  async refundPayment(captureId, amount, currency = 'USD') {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      
      const refundPayload = {};
      
      // If partial refund
      if (amount) {
        refundPayload.amount = {
          value: amount.toString(),
          currency_code: currency
        };
      }
      
      request.requestBody(refundPayload);
      
      const response = await this.client.execute(request);
      
      return {
        refundId: response.result.id,
        status: this.mapRefundStatus(response.result.status),
        amount: amount || parseFloat(response.result.amount.value),
        metadata: response.result,
      };
    } catch (error) {
      logger.error('PayPal refund failed:', error);
      throw new PaymentProcessingError('Failed to refund payment with PayPal', {
        originalError: error,
        provider: this.provider,
        errorCode: error.statusCode,
      });
    }
  }

  async webhookHandler(headers, payload) {
    try {
      // PayPal webhook verification logic would go here
      // This is simplified for now
      const event = JSON.parse(payload);
      
      return {
        event,
        eventType: event.event_type,
      };
    } catch (error) {
      logger.error('PayPal webhook validation failed:', error);
      throw new PaymentProcessingError('Failed to validate PayPal webhook', {
        originalError: error,
        provider: this.provider,
      });
    }
  }

  _getApprovalUrl(links) {
    for (const link of links) {
      if (link.rel === 'approve') {
        return link.href;
      }
    }
    return null;
  }

  mapPaymentStatus(paypalStatus) {
    const statusMap = {
      'CREATED': 'initiated',
      'SAVED': 'initiated',
      'APPROVED': 'processing',
      'PAYER_ACTION_REQUIRED': 'processing',
      'VOIDED': 'canceled',
      'COMPLETED': 'completed',
    };
    
    return statusMap[paypalStatus] || 'failed';
  }

  mapRefundStatus(paypalStatus) {
    const statusMap = {
      'CANCELLED': 'failed',
      'PENDING': 'processing',
      'COMPLETED': 'completed',
    };
    
    return statusMap[paypalStatus] || 'failed';
  }
}

module.exports = new PayPalAdapter();