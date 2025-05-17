import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const API_KEY = process.env.REACT_APP_API_KEY;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
const api = {
  // Authentication
  login: credentials => apiClient.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  },

  // Payments
  createPayment: paymentData => apiClient.post('/payments', paymentData),
  getPayment: id => apiClient.get(`/payments/${id}`),
  getTransactions: params => apiClient.get('/payments', { params }),
  refundPayment: (id, refundData) => apiClient.post(`/payments/${id}/refund`, refundData),
  confirmPayment: (id, confirmData) => apiClient.post(`/payments/${id}/confirm`, confirmData),

  // Tokenization
  tokenizePaymentMethod: data => apiClient.post('/payments/tokens', data),
  deleteToken: id => apiClient.delete(`/payments/tokens/${id}`),

  // Provider sessions
  getProviderSession: provider => apiClient.post(`/payments/sessions/${provider}`),

  // Reports and analytics
  getTransactionVolume: params => apiClient.get('/reports/volume', { params }),
  getProviderDistribution: params => apiClient.get('/reports/providers', { params }),
  getSuccessRates: params => apiClient.get('/reports/success-rates', { params }),
  getRevenueReport: params => apiClient.get('/reports/revenue', { params }),

  // Webhooks (admin only)
  getWebhookEvents: params => apiClient.get('/webhooks/events', { params }),

  // Utility
  healthCheck: () => apiClient.get('/health')
};

export default api;