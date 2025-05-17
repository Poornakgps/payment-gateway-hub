import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import api from '../../services/api';

const PaymentForm = ({ amount, currency = 'USD', onSuccess, onError }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [provider, setProvider] = useState('stripe');

  useEffect(() => {
    // Initialize the payment session when component mounts
    const initializePayment = async () => {
      try {
        const response = await api.post('/payments/sessions/stripe', {
          amount,
          currency
        });
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        setErrorMessage('Failed to initialize payment. Please try again.');
        console.error('Payment initialization error:', error);
      }
    };

    initializePayment();
  }, [amount, currency]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
    setErrorMessage('');
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
    setErrorMessage('');
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setErrorMessage('');
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber.trim()) return 'Card number is required';
    if (!cardDetails.cardholderName.trim()) return 'Cardholder name is required';
    if (!cardDetails.expiryMonth.trim()) return 'Expiry month is required';
    if (!cardDetails.expiryYear.trim()) return 'Expiry year is required';
    if (!cardDetails.cvv.trim()) return 'CVV is required';
    
    // Basic validation
    if (!/^\d{13,19}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) 
      return 'Invalid card number';
    if (!/^\d{1,2}$/.test(cardDetails.expiryMonth) || parseInt(cardDetails.expiryMonth) < 1 || parseInt(cardDetails.expiryMonth) > 12)
      return 'Invalid expiry month';
    if (!/^\d{2,4}$/.test(cardDetails.expiryYear))
      return 'Invalid expiry year';
    if (!/^\d{3,4}$/.test(cardDetails.cvv))
      return 'Invalid CVV';
      
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (paymentMethod === 'card') {
      const validationError = validateCardDetails();
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }
    
    setIsProcessing(true);
    
    try {
      // First tokenize the payment method
      const tokenResponse = await api.post('/payments/tokens', {
        type: paymentMethod,
        ...cardDetails
      });
      
      // Then create the payment with the token
      const paymentResponse = await api.post('/payments', {
        amount,
        currency,
        provider,
        paymentMethod: tokenResponse.data.tokenId,
        description: 'Payment for order',
      });
      
      // For client-side confirmation (Stripe)
      if (paymentResponse.data.requiresAction) {
        // In a real implementation, we would use the Stripe.js SDK to handle confirmation
        console.log('Payment requires confirmation with client secret:', paymentResponse.data.clientSecret);
      }
      
      onSuccess(paymentResponse.data);
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.response?.data?.message || 'Payment failed. Please try again.');
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center">Payment Details</h2>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {errorMessage}
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between border rounded overflow-hidden">
          <button
            type="button"
            className={`flex-1 py-2 flex items-center justify-center gap-2 ${
              paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50'
            }`}
            onClick={() => handlePaymentMethodChange('card')}
          >
            <CreditCard size={18} />
            <span>Card</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 flex items-center justify-center gap-2 ${
              paymentMethod === 'paypal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50'
            }`}
            onClick={() => handlePaymentMethodChange('paypal')}
          >
            <Wallet size={18} />
            <span>PayPal</span>
          </button>
        </div>
      </div>
      
      <div onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Payment Provider</label>
          <select
            value={provider}
            onChange={handleProviderChange}
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        
        {paymentMethod === 'card' ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <input
                type="text"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                name="cardholderName"
                value={cardDetails.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Expiry Month</label>
                <input
                  type="text"
                  name="expiryMonth"
                  value={cardDetails.expiryMonth}
                  onChange={handleInputChange}
                  placeholder="MM"
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Expiry Year</label>
                <input
                  type="text"
                  name="expiryYear"
                  value={cardDetails.expiryYear}
                  onChange={handleInputChange}
                  placeholder="YY"
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4 p-4 bg-gray-50 rounded border">
            <p className="text-center">
              You will be redirected to PayPal to complete your payment of{' '}
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency
                }).format(amount)}
              </span>
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;