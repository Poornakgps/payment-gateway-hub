import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import TransactionList from './components/dashboard/TransactionList';
import PaymentForm from './components/forms/PaymentForm';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import TestingSandbox from './components/sandbox/TestingSandbox';
import ComponentTest from './pages/ComponentTest';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth_token') !== null
  );

  const login = (token) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />
        
        <main className="container mx-auto py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={isAuthenticated ? (
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              ) : <Navigate to="/login" />}
            />
            <Route
              path="/transactions"
              element={isAuthenticated ? (
                <ErrorBoundary>
                  <Transactions />
                </ErrorBoundary>
              ) : <Navigate to="/login" />}
            />
            <Route
              path="/transactions/:id"
              element={isAuthenticated ? (
                <ErrorBoundary>
                  <TransactionDetails />
                </ErrorBoundary>
              ) : <Navigate to="/login" />}
            />
            <Route
              path="/reports"
              element={isAuthenticated ? (
                <ErrorBoundary>
                  <Reports />
                </ErrorBoundary>
              ) : <Navigate to="/login" />}
            />
            
            {/* Public routes */}
            <Route path="/sandbox" element={
              <ErrorBoundary>
                <TestingSandbox />
              </ErrorBoundary>
            } />
            <Route path="/checkout" element={
              <ErrorBoundary>
                <CheckoutPage />
              </ErrorBoundary>
            } />
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            
            {/* Test route */}
            <Route path="/test" element={<ComponentTest />} />
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <footer className="bg-white py-6 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">
                  &copy; {new Date().getFullYear()} Payment Gateway Hub
                </p>
              </div>
              <div className="flex space-x-4">
                <a href="/docs" className="text-gray-600 hover:text-blue-600">
                  Documentation
                </a>
                <a href="/sandbox" className="text-gray-600 hover:text-blue-600">
                  Testing Sandbox
                </a>
                <a href="/support" className="text-gray-600 hover:text-blue-600">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

// Placeholder components for routes that we haven't fully implemented yet
const TransactionDetails = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>
    <p>Transaction details would be displayed here...</p>
  </div>
);

const CheckoutPage = () => {
  const handleSuccess = (data) => {
    alert(`Payment successful! Transaction ID: ${data.transactionId}`);
  };

  const handleError = (error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <PaymentForm 
        amount={99.99} 
        currency="USD" 
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // This is a mock login - in a real app, you would call an API
    onLogin('mock-jwt-token');
  };
  
  return (
    <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

const NotFound = () => (
  <div className="text-center py-12">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p className="text-xl mb-6">Page not found</p>
    <a href="/" className="text-blue-600 hover:underline">
      Return to homepage
    </a>
  </div>
);

export default App;