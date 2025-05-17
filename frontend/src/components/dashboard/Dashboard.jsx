import React, { useState } from 'react';
import { CreditCard, DollarSign, TrendingUp, Users, BarChart2 } from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';
import TransactionList from './TransactionList';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const overviewStats = [
    {
      title: 'Total Transactions',
      value: '3,254',
      change: '+12.5%',
      trend: 'up',
      icon: <CreditCard size={20} />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Revenue',
      value: '$342,590.50',
      change: '+8.2%',
      trend: 'up',
      icon: <DollarSign size={20} />,
      color: 'bg-green-500'
    },
    {
      title: 'Success Rate',
      value: '97.8%',
      change: '+1.2%',
      trend: 'up',
      icon: <TrendingUp size={20} />,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Customers',
      value: '1,482',
      change: '+5.3%',
      trend: 'up',
      icon: <Users size={20} />,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Payment Gateway Dashboard</h1>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {overviewStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 font-medium">{stat.title}</span>
                  <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="text-2xl font-bold mr-2">{stat.value}</span>
                  <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <AnalyticsChart />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart2 size={20} className="mr-2" />
                Provider Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Stripe</span>
                    <span className="text-gray-500">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">PayPal</span>
                    <span className="text-gray-500">32%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4 mt-8 flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Payment Status
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Completed</span>
                    <span className="text-gray-500">97.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '97.8%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Failed</span>
                    <span className="text-gray-500">1.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '1.2%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Processing</span>
                    <span className="text-gray-500">1.0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '1.0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <TransactionList limit={5} />
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
          <TransactionList />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Detailed Analytics</h2>
          <AnalyticsChart />
        </div>
      )}
    </div>
  );
};

export default Dashboard;