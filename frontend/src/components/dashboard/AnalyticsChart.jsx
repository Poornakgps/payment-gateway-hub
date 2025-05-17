import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const AnalyticsChart = () => {
  const [chartType, setChartType] = useState('volume');
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchChartData();
  }, [chartType, timeRange]);

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range based on selected time range
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

      // Format dates for API
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      let response;
      
      // Fetch different reports based on chart type
      switch (chartType) {
        case 'volume':
          response = await api.get('/reports/volume', {
            params: { fromDate: fromDateStr, toDate: toDateStr }
          });
          setData(response.data.data);
          break;
        case 'providers':
          response = await api.get('/reports/providers', {
            params: { fromDate: fromDateStr, toDate: toDateStr }
          });
          setData(response.data.data);
          break;
        case 'success':
          response = await api.get('/reports/success-rates', {
            params: { fromDate: fromDateStr, toDate: toDateStr }
          });
          setData(response.data.data);
          break;
        case 'revenue':
          response = await api.get('/reports/revenue', {
            params: { fromDate: fromDateStr, toDate: toDateStr }
          });
          setData(response.data.data);
          break;
        default:
          throw new Error('Invalid chart type');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError('Failed to load chart data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVolumeChart = () => {
    if (!data || !data.dailyData) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data.dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="count" name="Transaction Count" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line yAxisId="right" type="monotone" dataKey="rawAmount" name="Transaction Volume ($)" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderProviderChart = () => {
    if (!data || !data.providerData) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data.providerData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={150}
            fill="#8884d8"
            dataKey="count"
            nameKey="provider"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.providerData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [value, props.payload.provider]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderSuccessChart = () => {
    if (!data || !data.statusData) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.statusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Transaction Count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderRevenueChart = () => {
    if (!data || !data.dailyRevenue) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
          <Legend />
          <Line type="monotone" dataKey="rawNetRevenue" name="Net Revenue" stroke="#82ca9d" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'volume':
        return renderVolumeChart();
      case 'providers':
        return renderProviderChart();
      case 'success':
        return renderSuccessChart();
      case 'revenue':
        return renderRevenueChart();
      default:
        return null;
    }
  };

  const renderSummary = () => {
    if (!data || !data.summary) return null;

    switch (chartType) {
      case 'volume':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold">{data.summary.totalTransactionCount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Volume</h3>
              <p className="text-2xl font-bold">{data.summary.totalAmount}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Avg. Transaction Value</h3>
              <p className="text-2xl font-bold">{data.summary.avgTransactionValue}</p>
            </div>
          </div>
        );
      case 'providers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Providers</h3>
              <p className="text-2xl font-bold">{data.summary.totalProviders}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Top Provider</h3>
              <p className="text-2xl font-bold capitalize">{data.summary.topProvider}</p>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold">{data.summary.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Success Rate</h3>
              <p className="text-2xl font-bold text-green-600">{data.summary.successRate}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Failure Rate</h3>
              <p className="text-2xl font-bold text-red-600">{data.summary.failureRate}</p>
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold">{data.summary.totalRevenue}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold">{data.summary.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-500">Avg. Revenue/Transaction</h3>
              <p className="text-2xl font-bold">{data.summary.averageRevenuePerTransaction}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 sm:mb-0">Payment Analytics</h2>
        <div className="flex space-x-2">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border rounded p-2"
          >
            <option value="volume">Transaction Volume</option>
            <option value="providers">Provider Distribution</option>
            <option value="success">Success Rates</option>
            <option value="revenue">Revenue</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded p-2"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {renderSummary()}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="bg-white p-4 rounded shadow">
          {renderChart()}
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;