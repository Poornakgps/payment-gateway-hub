import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import TransactionList from '../components/dashboard/TransactionList';
import FilterForm from '../components/forms/FilterForm';
import api from '../services/api';

const Transactions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    fromDate: '',
    toDate: '',
    customerId: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getTransactions({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      setTransactions(response.data.transactions || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => window.history.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Transactions</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw size={18} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={18} className="mr-2" />
          )}
          Refresh
        </button>
      </div>

      <FilterForm 
        onFilter={handleFilterChange} 
        initialValues={filters}
        filterOptions={{
          showCustomerId: true,
          statuses: [
            { value: 'completed', label: 'Completed' },
            { value: 'processing', label: 'Processing' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'partially_refunded', label: 'Partially Refunded' },
            { value: 'canceled', label: 'Canceled' }
          ],
          providers: [
            { value: 'stripe', label: 'Stripe' },
            { value: 'paypal', label: 'PayPal' }
          ]
        }}
      />

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <TransactionList 
        transactions={transactions}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Transactions;