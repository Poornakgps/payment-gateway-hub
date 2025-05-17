import React, { useState } from 'react';
import Button from '../common/Button';

const FilterForm = ({ onFilter, initialValues = {}, filterOptions }) => {
  const [filters, setFilters] = useState({
    status: initialValues.status || '',
    provider: initialValues.provider || '',
    fromDate: initialValues.fromDate || '',
    toDate: initialValues.toDate || '',
    customerId: initialValues.customerId || '',
    ...initialValues
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      provider: '',
      fromDate: '',
      toDate: '',
      customerId: '',
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1 text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {filterOptions?.statuses?.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            )) || (
              <>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
                <option value="canceled">Canceled</option>
              </>
            )}
          </select>
        </div>
        
        <div>
          <label htmlFor="provider" className="block text-sm font-medium mb-1 text-gray-700">
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={filters.provider}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Providers</option>
            {filterOptions?.providers?.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            )) || (
              <>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </>
            )}
          </select>
        </div>
        
        <div>
          <label htmlFor="fromDate" className="block text-sm font-medium mb-1 text-gray-700">
            From Date
          </label>
          <input
            id="fromDate"
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="toDate" className="block text-sm font-medium mb-1 text-gray-700">
            To Date
          </label>
          <input
            id="toDate"
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {filterOptions?.showCustomerId && (
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium mb-1 text-gray-700">
              Customer ID
            </label>
            <input
              id="customerId"
              type="text"
              name="customerId"
              value={filters.customerId}
              onChange={handleChange}
              placeholder="Enter customer ID"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="secondary" 
          type="button" 
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button 
          variant="primary" 
          type="submit"
        >
          Apply Filters
        </Button>
      </div>
    </form>
  );
};

export default FilterForm;