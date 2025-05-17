import React, { useState } from 'react';
import PaymentForm from '../components/forms/PaymentForm';

const TestingSandbox = () => {
  const [testMode, setTestMode] = useState('success');
  const [amount, setAmount] = useState(19.99);
  const [currency, setCurrency] = useState('USD');
  const [provider, setProvider] = useState('stripe');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handlePaymentSuccess = (paymentData) => {
    setResult({
      status: 'success',
      data: paymentData
    });
    setShowResult(true);
  };

  const handlePaymentError = (error) => {
    setResult({
      status: 'error',
      error: error.response?.data || { message: 'Payment failed' }
    });
    setShowResult(true);
  };

  const handleTestModeChange = (e) => {
    setTestMode(e.target.value);
    setShowResult(false);
  };

  const handleAmountChange = (e) => {
    setAmount(parseFloat(e.target.value));
    setShowResult(false);
  };

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    setShowResult(false);
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
    setShowResult(false);
  };

  const getTestCardInfo = () => {
    if (provider === 'stripe') {
      switch (testMode) {
        case 'success':
          return {
            number: '4242 4242 4242 4242',
            expiry: 'Any future date',
            cvc: 'Any 3 digits',
            message: 'Always succeeds'
          };
        case 'decline':
          return {
            number: '4000 0000 0000 0002',
            expiry: 'Any future date',
            cvc: 'Any 3 digits',
            message: 'Generic decline'
          };
        case '3dsecure':
          return {
            number: '4000 0000 0000 3220',
            expiry: 'Any future date',
            cvc: 'Any 3 digits',
            message: 'Requires 3D Secure authentication'
          };
        case 'insufficient':
          return {
            number: '4000 0000 0000 9995',
            expiry: 'Any future date',
            cvc: 'Any 3 digits',
            message: 'Insufficient funds failure'
          };
        default:
          return {
            number: '4242 4242 4242 4242',
            expiry: 'Any future date',
            cvc: 'Any 3 digits',
            message: 'Always succeeds'
          };
      }
    } else if (provider === 'paypal') {
      return {
        email: 'sb-buyer@sandbox.com',
        password: 'sandbox_password',
        message: 'PayPal Sandbox credentials'
      };
    }
  };

  const formatJSON = (json) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Payment Testing Sandbox</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Test Mode</label>
                <select
                  value={testMode}
                  onChange={handleTestModeChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="success">Success</option>
                  <option value="decline">Declined</option>
                  <option value="3dsecure">3D Secure</option>
                  <option value="insufficient">Insufficient Funds</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  step="0.01"
                  min="0.01"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Currency</label>
                <select
                  value={currency}
                  onChange={handleCurrencyChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Provider</label>
                <select
                  value={provider}
                  onChange={handleProviderChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Card Information</h2>
            <div className="space-y-3">
              {provider === 'stripe' ? (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Card Number:</span>
                    <p className="font-mono bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().number}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Expiry Date:</span>
                    <p className="font-mono bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().expiry}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">CVC:</span>
                    <p className="font-mono bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().cvc}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sandbox Email:</span>
                    <p className="font-mono bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sandbox Password:</span>
                    <p className="font-mono bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().password}</p>
                  </div>
                </>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700">Behavior:</span>
                <p className="bg-gray-100 p-2 rounded mt-1">{getTestCardInfo().message}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Form</h2>
            <PaymentForm 
              amount={amount} 
              currency={currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
          
          {showResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Result {result.status === 'success' ? '✅' : '❌'}
              </h2>
              <div className="overflow-x-auto">
                <pre className={`bg-gray-100 p-4 rounded font-mono text-sm overflow-auto max-h-96 ${
                  result.status === 'error' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {formatJSON(result.data || result.error)}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                <h3 className="font-medium text-blue-700 mb-2">Integration Tip</h3>
                <p className="text-sm text-blue-800">
                  {result.status === 'success' 
                    ? 'Save the transaction ID to track this payment and update your order status.' 
                    : 'Handle this error gracefully in your application by showing a user-friendly message.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Integration Code Samples</h2>
        
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-2">React Example</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto">
{`import React, { useState } from 'react';
import axios from 'axios';

const YourCheckoutComponent = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Step 1: Tokenize the payment method
      const tokenResponse = await axios.post('https://your-api.com/payments/tokens', {
        type: 'card',
        cardNumber: '4242424242424242',
        cardholderName: 'Customer Name',
        expiryMonth: '12',
        expiryYear: '25',
        cvv: '123'
      });
      
      // Step 2: Create the payment with the token
      const paymentResponse = await axios.post('https://your-api.com/payments', {
        amount: 19.99,
        currency: 'USD',
        provider: 'stripe',
        paymentMethod: tokenResponse.data.tokenId,
        description: 'Payment for order #1234'
      });
      
      // Handle success
      console.log('Payment successful!', paymentResponse.data);
      
    } catch (error) {
      // Handle error
      console.error('Payment failed:', error.response.data);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <button 
      onClick={handlePayment} 
      disabled={isProcessing}
    >
      {isProcessing ? 'Processing...' : 'Pay Now'}
    </button>
  );
};`}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-2">Node.js Server Example</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto">
{`const express = require('express');
const axios = require('axios');
const router = express.Router();

// Process a payment
router.post('/process-payment', async (req, res) => {
  try {
    const { amount, orderId, customerName, cardDetails } = req.body;
    
    // Step 1: Tokenize the card
    const tokenResponse = await axios.post('https://payment-api.com/payments/tokens', {
      type: 'card',
      ...cardDetails
    }, {
      headers: {
        'x-api-key': process.env.PAYMENT_API_KEY
      }
    });
    
    // Step 2: Create the payment
    const paymentResponse = await axios.post('https://payment-api.com/payments', {
      amount,
      currency: 'USD',
      provider: 'stripe',
      paymentMethod: tokenResponse.data.tokenId,
      description: \`Payment for order \${orderId}\`,
      metadata: {
        orderId,
        customerName
      }
    }, {
      headers: {
        'x-api-key': process.env.PAYMENT_API_KEY
      }
    });
    
    // Update order status in your database
    await updateOrderStatus(orderId, 'paid', paymentResponse.data.transactionId);
    
    res.status(200).json({
      success: true,
      transactionId: paymentResponse.data.transactionId
    });
    
  } catch (error) {
    console.error('Payment processing error:', error.response?.data || error.message);
    
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || 'Payment processing failed'
    });
  }
});

module.exports = router;`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestingSandbox;