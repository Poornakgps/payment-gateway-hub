import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FilterForm from '../components/forms/FilterForm';
import api from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('volume');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    provider: '',
    status: ''
  });

  useEffect(() => {
    // Set default date range based on selected time range
    const toDate = new Date();
    let fromDate = new Date();
    
    switch (timeRange) {
      case '7d':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case '90d':
        fromDate.setDate(fromDate.getDate() - 90);
        break;
      case '1y':
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      default:
        fromDate.setDate(fromDate.getDate() - 30);
    }

    setFilters({
      ...filters,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    });
  }, [timeRange]);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, filters]);

  const fetchReportData = async () => {
    if (!filters.fromDate || !filters.toDate) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      switch (activeReport) {
        case 'volume':
          response = await api.getTransactionVolume(filters);
          break;
        case 'providers':
          response = await api.getProviderDistribution(filters);
          break;
        case 'success':
          response = await api.getSuccessRates(filters);
          break;
        case 'revenue':
          response = await api.getRevenueReport(filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      setReportData(response.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF report
    alert('Export to PDF functionality would be implemented here');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReportTabs = () => (
    <div className="flex flex-wrap mb-6 space-x-2">
      <button
        className={`px-4 py-2 rounded-lg ${
          activeReport === 'volume' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
        onClick={() => setActiveReport('volume')}
      >
        Transaction Volume
      </button>
      <button
        className={`px-4 py-2 rounded-lg ${
          activeReport === 'providers' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
        onClick={() => setActiveReport('providers')}
      >
        Provider Distribution
      </button>
      <button
        className={`px-4 py-2 rounded-lg ${
          activeReport === 'success' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
        onClick={() => setActiveReport('success')}
      >
        Success Rates
      </button>
      <button
        className={`px-4 py-2 rounded-lg ${
          activeReport === 'revenue' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
        onClick={() => setActiveReport('revenue')}
      >
        Revenue Analysis
      </button>
    </div>
  );

  const renderSummaryCards = () => {
    if (!reportData || !reportData.summary) return null;

    switch (activeReport) {
      case 'volume':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Transactions</div>
              <div className="text-2xl font-bold">{reportData.summary.totalTransactionCount.toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Volume</div>
              <div className="text-2xl font-bold">{reportData.summary.totalAmount}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Avg. Transaction Value</div>
              <div className="text-2xl font-bold">{reportData.summary.avgTransactionValue}</div>
            </Card>
          </div>
        );
      case 'providers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Providers</div>
              <div className="text-2xl font-bold">{reportData.summary.totalProviders}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Top Provider</div>
              <div className="text-2xl font-bold capitalize">{reportData.summary.topProvider}</div>
            </Card>
          </div>
        );
      case 'success':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Transactions</div>
              <div className="text-2xl font-bold">{reportData.summary.totalTransactions.toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{reportData.summary.successRate}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Failure Rate</div>
              <div className="text-2xl font-bold text-red-600">{reportData.summary.failureRate}</div>
            </Card>
          </div>
        );
      case 'revenue':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Revenue</div>
              <div className="text-2xl font-bold">{reportData.summary.totalRevenue}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Total Transactions</div>
              <div className="text-2xl font-bold">{reportData.summary.totalTransactions.toLocaleString()}</div>
            </Card>
            <Card>
              <div className="text-gray-500 font-medium mb-1">Avg. Revenue/Transaction</div>
              <div className="text-2xl font-bold">{reportData.summary.averageRevenuePerTransaction}</div>
            </Card>
          </div>
        );
      default:
        return null;
    }
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
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            icon={<Download size={18} />}
          >
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            icon={<Printer size={18} />}
          >
            Print
          </Button>
        </div>
      </div>

      {renderReportTabs()}

      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="w-full md:w-auto">
          <label htmlFor="timeRange" className="block text-sm font-medium mb-1 text-gray-700">
            Time Range
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="w-full md:w-auto px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {timeRange === 'custom' && (
          <FilterForm 
            onFilter={handleFilterChange} 
            initialValues={filters}
            filterOptions={{
              showCustomerId: false,
              providers: [
                { value: 'stripe', label: 'Stripe' },
                { value: 'paypal', label: 'PayPal' }
              ]
            }}
          />
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {renderSummaryCards()}

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {activeReport === 'volume' && 'Transaction Volume Over Time'}
          {activeReport === 'providers' && 'Payment Provider Distribution'}
          {activeReport === 'success' && 'Payment Success Rates'}
          {activeReport === 'revenue' && 'Revenue Analysis'}
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <AnalyticsChart 
            chartType={activeReport}
            data={reportData}
          />
        )}
      </Card>

      {activeReport === 'volume' && reportData?.dailyData && (
        <Card title="Transaction Details">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.dailyData.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeReport === 'revenue' && reportData?.monthlyRevenue && (
        <Card title="Monthly Revenue">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.monthlyRevenue.map((month, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.transactionCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.netRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;