// frontend/src/pages/ComponentTest.jsx
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PaymentForm from '../components/forms/PaymentForm';
import TransactionList from '../components/dashboard/TransactionList';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';

// Sample data
const sampleTransactions = [
  {
    id: '8f7d9e6c-5b4a-3210',
    createdAt: new Date().toISOString(),
    amount: 129.99,
    currency: 'USD',
    provider: 'stripe',
    status: 'completed'
  },
  {
    id: '7e6c5b4a-3210-8f7d',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    amount: 79.99,
    currency: 'USD',
    provider: 'paypal',
    status: 'processing'
  },
  {
    id: '6c5b4a32-108f-7d9e',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    amount: 49.99,
    currency: 'USD',
    provider: 'stripe',
    status: 'failed'
  }
];

const ComponentTest = () => {
  const [testStatus, setTestStatus] = useState({});
  
  const logTestResult = (component, result, details = null) => {
    console.log(`Test: ${component} - ${result}`, details);
    setTestStatus(prev => ({
      ...prev,
      [component]: { result, details, timestamp: new Date().toISOString() }
    }));
  };

  const handlePaymentSuccess = (data) => {
    logTestResult('PaymentForm', 'Success', data);
  };

  const handlePaymentError = (error) => {
    logTestResult('PaymentForm', 'Error', error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Component Visual Test</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-100 p-2">1. Button Component Tests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button size="small">Small Button</Button>
          <Button size="large">Large Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button fullWidth>Full Width Button</Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-100 p-2">2. Card Component Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Basic Card" subtitle="Card with title and subtitle">
            <p>This is a basic card with some content.</p>
          </Card>
          
          <Card>
            <p>This is a card without title or subtitle.</p>
          </Card>
          
          <Card 
            title="Card with Footer" 
            footer={<Button size="small">Card Action</Button>}
          >
            <p>This card has a footer with an action button.</p>
          </Card>
          
          <Card hover={true}>
            <p>This card has hover effects enabled.</p>
          </Card>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-100 p-2">3. Payment Form Test</h2>
        <PaymentForm 
          amount={99.99} 
          currency="USD"
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
        {testStatus.PaymentForm && (
          <div className={`mt-4 p-3 rounded ${
            testStatus.PaymentForm.result === 'Success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            Last result: {testStatus.PaymentForm.result}
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(testStatus.PaymentForm.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-100 p-2">4. Transaction List Test</h2>
        <TransactionList transactions={sampleTransactions} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gray-100 p-2">5. Analytics Chart Test</h2>
        <AnalyticsChart />
      </div>
      
      <div className="mb-8 bg-yellow-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-80">
          {JSON.stringify(testStatus, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ComponentTest;