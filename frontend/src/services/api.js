import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-api-key';
const STANDALONE_MODE = true; // Set to false when connecting to real backend

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

// Local storage data
const getLocalData = (key, defaultData = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    console.error(`Error retrieving ${key} from localStorage:`, e);
    return defaultData;
  }
};

const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
    return false;
  }
};

// Generate fake transaction data
const generateTransactions = (count = 20) => {
  const statuses = ['completed', 'processing', 'failed', 'refunded', 'partially_refunded'];
  const providers = ['stripe', 'paypal'];
  const currencies = ['USD', 'EUR', 'GBP'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `tr_${Math.random().toString(36).substring(2, 10)}`,
    amount: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    provider: providers[Math.floor(Math.random() * providers.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    customerId: `cus_${Math.random().toString(36).substring(2, 8)}`,
    metadata: {},
    description: 'Test transaction'
  }));
};

// Generate initial data if needed
if (STANDALONE_MODE && !localStorage.getItem('transactions')) {
  saveLocalData('transactions', generateTransactions(50));
}

// API service methods
const api = {
  // Authentication
  login: credentials => {
    if (STANDALONE_MODE) {
      // Always succeed in standalone mode with mock token
      return Promise.resolve({ data: { token: 'mock-jwt-token', user: { name: 'Test User', email: credentials.email } } });
    }
    return apiClient.post('/auth/login', credentials);
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  },

  // Payments
  createPayment: paymentData => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const newTransaction = {
        id: `tr_${Math.random().toString(36).substring(2, 10)}`,
        ...paymentData,
        status: 'completed',
        createdAt: new Date().toISOString(),
        providerTransactionId: `pi_${Math.random().toString(36).substring(2, 10)}`
      };
      
      transactions.unshift(newTransaction);
      saveLocalData('transactions', transactions);
      
      return Promise.resolve({ 
        data: { 
          transactionId: newTransaction.id,
          status: 'completed',
          providerTransactionId: newTransaction.providerTransactionId
        } 
      });
    }
    return apiClient.post('/payments', paymentData);
  },
  
  getPayment: id => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const transaction = transactions.find(t => t.id === id);
      
      if (!transaction) {
        return Promise.reject({ response: { status: 404, data: { message: 'Transaction not found' } } });
      }
      
      return Promise.resolve({ data: transaction });
    }
    return apiClient.get(`/payments/${id}`);
  },
  
  getTransactions: params => {
    if (STANDALONE_MODE) {
      let transactions = getLocalData('transactions', []);
      
      // Apply filters
      if (params) {
        if (params.status) {
          transactions = transactions.filter(t => t.status === params.status);
        }
        if (params.provider) {
          transactions = transactions.filter(t => t.provider === params.provider);
        }
        if (params.customerId) {
          transactions = transactions.filter(t => t.customerId === params.customerId);
        }
        if (params.fromDate) {
          const fromDate = new Date(params.fromDate);
          transactions = transactions.filter(t => new Date(t.createdAt) >= fromDate);
        }
        if (params.toDate) {
          const toDate = new Date(params.toDate);
          transactions = transactions.filter(t => new Date(t.createdAt) <= toDate);
        }
      }
      
      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const offset = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(offset, offset + limit);
      
      return Promise.resolve({ 
        data: { 
          transactions: paginatedTransactions,
          pagination: {
            total: transactions.length,
            page,
            limit,
            pages: Math.ceil(transactions.length / limit)
          }
        } 
      });
    }
    return apiClient.get('/payments', { params });
  },
  
  refundPayment: (id, refundData) => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        return Promise.reject({ response: { status: 404, data: { message: 'Transaction not found' } } });
      }
      
      const transaction = transactions[index];
      if (transaction.status !== 'completed') {
        return Promise.reject({ 
          response: { 
            status: 400, 
            data: { message: 'Cannot refund a transaction that is not completed' } 
          } 
        });
      }
      
      const refundAmount = refundData?.amount || transaction.amount;
      const isFullRefund = refundAmount >= transaction.amount;
      
      transactions[index] = {
        ...transaction,
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refundedAmount: refundAmount
      };
      
      saveLocalData('transactions', transactions);
      
      return Promise.resolve({ 
        data: { 
          transactionId: id,
          status: transactions[index].status,
          refundId: `re_${Math.random().toString(36).substring(2, 10)}`,
          refundedAmount: refundAmount
        } 
      });
    }
    return apiClient.post(`/payments/${id}/refund`, refundData);
  },
  
  confirmPayment: (id, confirmData) => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        return Promise.reject({ response: { status: 404, data: { message: 'Transaction not found' } } });
      }
      
      transactions[index] = {
        ...transactions[index],
        status: 'completed'
      };
      
      saveLocalData('transactions', transactions);
      
      return Promise.resolve({ 
        data: { 
          transactionId: id,
          status: 'completed',
          providerTransactionId: transactions[index].providerTransactionId
        } 
      });
    }
    return apiClient.post(`/payments/${id}/confirm`, confirmData);
  },

  // Tokenization
  tokenizePaymentMethod: data => {
    if (STANDALONE_MODE) {
      // Generate a fake token
      return Promise.resolve({ 
        data: { 
          tokenId: `tok_${Math.random().toString(36).substring(2, 10)}`,
          maskedData: {
            cardNumber: data.type === 'card' ? `**** **** **** ${data.cardNumber.slice(-4)}` : null,
            cardholderName: data.type === 'card' ? `${data.cardholderName.charAt(0)}. ${data.cardholderName.split(' ').pop()}` : null,
            expiryDate: data.type === 'card' ? `${data.expiryMonth}/${data.expiryYear}` : null,
            type: data.type
          }
        } 
      });
    }
    return apiClient.post('/payments/tokens', data);
  },
  
  deleteToken: id => {
    if (STANDALONE_MODE) {
      return Promise.resolve({ status: 204 });
    }
    return apiClient.delete(`/payments/tokens/${id}`);
  },

  // Provider sessions
  getProviderSession: provider => {
    if (STANDALONE_MODE) {
      return Promise.resolve({ 
        data: {
          sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
          provider,
          clientSecret: `${provider}_secret_${Math.random().toString(36).substring(2, 15)}`,
          timestamp: new Date().toISOString()
        } 
      });
    }
    return apiClient.post(`/payments/sessions/${provider}`);
  },

  // Reports and analytics
  getTransactionVolume: params => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const filteredTransactions = transactions.filter(t => {
        if (params.fromDate && new Date(t.createdAt) < new Date(params.fromDate)) return false;
        if (params.toDate && new Date(t.createdAt) > new Date(params.toDate)) return false;
        if (params.provider && t.provider !== params.provider) return false;
        if (params.status && t.status !== params.status) return false;
        return true;
      });
      
      // Group by date
      const groupedByDate = filteredTransactions.reduce((acc, transaction) => {
        const date = transaction.createdAt.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(transaction);
        return acc;
      }, {});
      
      // Calculate daily data
      const dailyData = Object.entries(groupedByDate).map(([date, dayTransactions]) => {
        const totalAmount = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return {
          date,
          count: dayTransactions.length,
          totalAmount: `$${totalAmount.toFixed(2)}`,
          rawAmount: totalAmount
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate summary
      const totalTransactionCount = filteredTransactions.length;
      const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const avgTransactionValue = totalTransactionCount > 0 ? totalAmount / totalTransactionCount : 0;
      
      return Promise.resolve({ 
        data: { 
          data: {
            dailyData,
            summary: {
              totalTransactionCount,
              totalAmount: `$${totalAmount.toFixed(2)}`,
              avgTransactionValue: `$${avgTransactionValue.toFixed(2)}`
            }
          }
        } 
      });
    }
    return apiClient.get('/reports/volume', { params });
  },
  
  getProviderDistribution: params => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const filteredTransactions = transactions.filter(t => {
        if (params.fromDate && new Date(t.createdAt) < new Date(params.fromDate)) return false;
        if (params.toDate && new Date(t.createdAt) > new Date(params.toDate)) return false;
        if (params.status && t.status !== params.status) return false;
        return true;
      });
      
      // Group by provider
      const groupedByProvider = filteredTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.provider]) acc[transaction.provider] = [];
        acc[transaction.provider].push(transaction);
        return acc;
      }, {});
      
      // Calculate provider data
      const providerData = Object.entries(groupedByProvider).map(([provider, providerTransactions]) => {
        const totalAmount = providerTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return {
          provider,
          count: providerTransactions.length,
          totalAmount: `$${totalAmount.toFixed(2)}`,
          rawAmount: totalAmount,
          percentage: (providerTransactions.length / filteredTransactions.length * 100).toFixed(1) + '%'
        };
      }).sort((a, b) => b.count - a.count);
      
      return Promise.resolve({ 
        data: { 
          data: {
            providerData,
            summary: {
              totalProviders: Object.keys(groupedByProvider).length,
              topProvider: providerData.length > 0 ? providerData[0].provider : 'None'
            }
          }
        } 
      });
    }
    return apiClient.get('/reports/providers', { params });
  },
  
  getSuccessRates: params => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const filteredTransactions = transactions.filter(t => {
        if (params.fromDate && new Date(t.createdAt) < new Date(params.fromDate)) return false;
        if (params.toDate && new Date(t.createdAt) > new Date(params.toDate)) return false;
        if (params.provider && t.provider !== params.provider) return false;
        return true;
      });
      
      // Group by status
      const groupedByStatus = filteredTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.status]) acc[transaction.status] = [];
        acc[transaction.status].push(transaction);
        return acc;
      }, {});
      
      // Calculate status data
      const statusData = Object.entries(groupedByStatus).map(([status, statusTransactions]) => {
        return {
          status,
          count: statusTransactions.length,
          percentage: (statusTransactions.length / filteredTransactions.length * 100).toFixed(1) + '%'
        };
      });
      
      // Calculate success rate
      const completed = groupedByStatus['completed'] || [];
      const successRate = filteredTransactions.length > 0 
        ? (completed.length / filteredTransactions.length * 100).toFixed(1) + '%'
        : '0%';
      
      // Group by provider
      const groupedByProvider = filteredTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.provider]) acc[transaction.provider] = [];
        acc[transaction.provider].push(transaction);
        return acc;
      }, {});
      
      // Calculate provider success rates
      const providerSuccessRates = {};
      Object.entries(groupedByProvider).forEach(([provider, providerTransactions]) => {
        const completedCount = providerTransactions.filter(t => t.status === 'completed').length;
        providerSuccessRates[provider] = {
          successRate: (completedCount / providerTransactions.length * 100).toFixed(1) + '%',
          totalTransactions: providerTransactions.length,
          completedTransactions: completedCount
        };
      });
      
      return Promise.resolve({ 
        data: { 
          data: {
            statusData,
            providerSuccessRates,
            summary: {
              totalTransactions: filteredTransactions.length,
              successRate,
              failureRate: (100 - parseFloat(successRate)).toFixed(1) + '%'
            }
          }
        } 
      });
    }
    return apiClient.get('/reports/success-rates', { params });
  },
  
  getRevenueReport: params => {
    if (STANDALONE_MODE) {
      const transactions = getLocalData('transactions', []);
      const filteredTransactions = transactions.filter(t => {
        if (params.fromDate && new Date(t.createdAt) < new Date(params.fromDate)) return false;
        if (params.toDate && new Date(t.createdAt) > new Date(params.toDate)) return false;
        if (params.provider && t.provider !== params.provider) return false;
        if (t.status !== 'completed') return false; // Only count completed transactions
        return true;
      });
      
      // Group by date
      const groupedByDate = filteredTransactions.reduce((acc, transaction) => {
        const date = transaction.createdAt.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(transaction);
        return acc;
      }, {});
      
      // Calculate fees (assuming 2.9% + $0.30 per transaction)
      const calculateFees = (amount) => amount * 0.029 + 0.30;
      
      // Calculate daily revenue data
      const dailyRevenue = Object.entries(groupedByDate).map(([date, dayTransactions]) => {
        const totalAmount = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const processingFees = dayTransactions.reduce((sum, t) => sum + calculateFees(parseFloat(t.amount)), 0);
        const netRevenue = totalAmount - processingFees;
        
        return {
          date,
          totalAmount: `$${totalAmount.toFixed(2)}`,
          processingFees: `$${processingFees.toFixed(2)}`,
          netRevenue: `$${netRevenue.toFixed(2)}`,
          rawNetRevenue: netRevenue,
          transactionCount: dayTransactions.length
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate monthly revenue
      const monthlyRevenue = dailyRevenue.reduce((acc, day) => {
        const date = new Date(day.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            netRevenue: 0,
            transactionCount: 0
          };
        }
        
        acc[monthKey].netRevenue += day.rawNetRevenue;
        acc[monthKey].transactionCount += day.transactionCount;
        
        return acc;
      }, {});
      
      // Format monthly revenue
      const formattedMonthlyRevenue = Object.values(monthlyRevenue).map(month => ({
        ...month,
        netRevenue: `$${month.netRevenue.toFixed(2)}`
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate summary
      const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.rawNetRevenue, 0);
      
      return Promise.resolve({ 
        data: { 
          data: {
            dailyRevenue,
            monthlyRevenue: formattedMonthlyRevenue,
            summary: {
              totalRevenue: `$${totalRevenue.toFixed(2)}`,
              totalTransactions: filteredTransactions.length,
              averageRevenuePerTransaction: filteredTransactions.length > 0 
                ? `$${(totalRevenue / filteredTransactions.length).toFixed(2)}`
                : '$0.00'
            }
          }
        } 
      });
    }
    return apiClient.get('/reports/revenue', { params });
  },

  // Utility
  healthCheck: () => {
    if (STANDALONE_MODE) {
      return Promise.resolve({ data: { status: 'ok', mode: 'standalone' } });
    }
    return apiClient.get('/health');
  }
};

export default api;