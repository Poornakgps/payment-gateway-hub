const { sequelize } = require('../models');
const { Op } = require('sequelize');
const Redis = require('ioredis');
const axios = require('axios');
const config = require('../config');
const logger = require('../../../shared/lib/logger');
const formatterUtil = require('../utils/formatter');

class AnalyticsService {
  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
    
    this.paymentServiceUrl = config.paymentService.url;
    this.paymentServiceApiKey = config.paymentService.apiKey;
  }

  /**
   * Get transaction volume by date range
   */
  async getTransactionVolume(filters = {}) {
    try {
      const cacheKey = `report:volume:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fetch from payment service
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments`, 
        {
          params: filters,
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      const transactions = response.data.transactions;
      
      // Group by date
      const groupedByDate = this._groupTransactionsByDate(transactions);
      
      // Calculate daily and total amounts
      const dailyData = Object.entries(groupedByDate).map(([date, transactions]) => {
        const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const count = transactions.length;
        
        return {
          date,
          totalAmount: formatterUtil.formatCurrency(totalAmount),
          count,
          rawAmount: totalAmount // Include raw amount for calculations
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate overall stats
      const totalTransactionCount = dailyData.reduce((sum, day) => sum + day.count, 0);
      const totalAmount = dailyData.reduce((sum, day) => sum + day.rawAmount, 0);
      const avgTransactionValue = totalTransactionCount > 0 
        ? totalAmount / totalTransactionCount 
        : 0;
      
      const result = {
        dailyData,
        summary: {
          totalTransactionCount,
          totalAmount: formatterUtil.formatCurrency(totalAmount),
          avgTransactionValue: formatterUtil.formatCurrency(avgTransactionValue)
        }
      };
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', config.redis.reportCacheTTL);
      
      return result;
    } catch (error) {
      logger.error('Error generating transaction volume report:', error);
      throw error;
    }
  }

  /**
   * Get payment provider distribution
   */
  async getProviderDistribution(filters = {}) {
    try {
      const cacheKey = `report:providers:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fetch from payment service
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments`, 
        {
          params: filters,
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      const transactions = response.data.transactions;
      
      // Group by provider
      const groupedByProvider = this._groupTransactionsByProvider(transactions);
      
      // Calculate totals by provider
      const providerData = Object.entries(groupedByProvider).map(([provider, transactions]) => {
        const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const count = transactions.length;
        
        return {
          provider,
          totalAmount: formatterUtil.formatCurrency(totalAmount),
          count,
          percentage: 0, // Will calculate after all providers processed
          rawAmount: totalAmount
        };
      });
      
      // Calculate percentages
      const totalCount = transactions.length;
      providerData.forEach(provider => {
        provider.percentage = totalCount > 0 
          ? formatterUtil.formatPercentage(provider.count / totalCount) 
          : '0%';
      });
      
      // Sort by count descending
      providerData.sort((a, b) => b.count - a.count);
      
      const result = {
        providerData,
        summary: {
          totalProviders: providerData.length,
          topProvider: providerData.length > 0 ? providerData[0].provider : 'None'
        }
      };
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', config.redis.reportCacheTTL);
      
      return result;
    } catch (error) {
      logger.error('Error generating provider distribution report:', error);
      throw error;
    }
  }

  /**
   * Get payment success and failure rates
   */
  async getSuccessRates(filters = {}) {
    try {
      const cacheKey = `report:success:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fetch from payment service
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments`, 
        {
          params: { ...filters, limit: 1000 }, // Get a larger sample
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      const transactions = response.data.transactions;
      
      // Group by status
      const groupedByStatus = this._groupTransactionsByStatus(transactions);
      
      // Calculate totals by status
      const statusData = Object.entries(groupedByStatus).map(([status, transactions]) => {
        const count = transactions.length;
        
        return {
          status,
          count,
          percentage: 0 // Will calculate after all statuses processed
        };
      });
      
      // Calculate percentages
      const totalCount = transactions.length;
      statusData.forEach(status => {
        status.percentage = totalCount > 0 
          ? formatterUtil.formatPercentage(status.count / totalCount) 
          : '0%';
      });
      
      // Calculate success rate
      const completed = groupedByStatus['completed'] || [];
      const successRate = totalCount > 0 
        ? formatterUtil.formatPercentage(completed.length / totalCount) 
        : '0%';
      
      // Calculate by provider
      const providerSuccessRates = this._calculateProviderSuccessRates(transactions);
      
      const result = {
        statusData,
        providerSuccessRates,
        summary: {
          totalTransactions: totalCount,
          successRate,
          failureRate: formatterUtil.formatPercentage(1 - (completed.length / totalCount))
        }
      };
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', config.redis.reportCacheTTL);
      
      return result;
    } catch (error) {
      logger.error('Error generating success rates report:', error);
      throw error;
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(filters = {}) {
    try {
      const cacheKey = `report:revenue:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fetch from payment service
      const response = await axios.get(
        `${this.paymentServiceUrl}/payments`, 
        {
          params: { ...filters, status: 'completed' }, // Only completed transactions
          headers: {
            'x-api-key': this.paymentServiceApiKey
          }
        }
      );
      
      const transactions = response.data.transactions;
      
      // Group by date
      const groupedByDate = this._groupTransactionsByDate(transactions);
      
      // Calculate revenue by day
      const revenueData = Object.entries(groupedByDate).map(([date, transactions]) => {
        // Assuming a 2.9% + $0.30 fee structure (similar to Stripe)
        const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const processingFees = this._calculateProcessingFees(transactions);
        const netRevenue = totalAmount - processingFees;
        
        return {
          date,
          totalAmount: formatterUtil.formatCurrency(totalAmount),
          processingFees: formatterUtil.formatCurrency(processingFees),
          netRevenue: formatterUtil.formatCurrency(netRevenue),
          transactionCount: transactions.length,
          rawNetRevenue: netRevenue // For calculations
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate monthly aggregates
      const monthlyRevenue = this._aggregateByMonth(revenueData);
      
      // Calculate overall stats
      const totalRevenue = revenueData.reduce((sum, day) => sum + day.rawNetRevenue, 0);
      const totalTransactions = transactions.length;
      
      const result = {
        dailyRevenue: revenueData,
        monthlyRevenue,
        summary: {
          totalRevenue: formatterUtil.formatCurrency(totalRevenue),
          totalTransactions,
          averageRevenuePerTransaction: formatterUtil.formatCurrency(
            totalTransactions > 0 ? totalRevenue / totalTransactions : 0
          )
        }
      };
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', config.redis.reportCacheTTL);
      
      return result;
    } catch (error) {
      logger.error('Error generating revenue report:', error);
      throw error;
    }
  }

  /**
   * Helper method to group transactions by date
   */
  _groupTransactionsByDate(transactions) {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {});
  }

  /**
   * Helper method to group transactions by provider
   */
  _groupTransactionsByProvider(transactions) {
    return transactions.reduce((groups, transaction) => {
      const provider = transaction.provider;
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(transaction);
      return groups;
    }, {});
  }

  /**
   * Helper method to group transactions by status
   */
  _groupTransactionsByStatus(transactions) {
    return transactions.reduce((groups, transaction) => {
      const status = transaction.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(transaction);
      return groups;
    }, {});
  }

  /**
   * Helper method to calculate provider success rates
   */
  _calculateProviderSuccessRates(transactions) {
    const providers = {};
    
    // Group by provider
    const groupedByProvider = this._groupTransactionsByProvider(transactions);
    
    // Calculate success rate for each provider
    Object.entries(groupedByProvider).forEach(([provider, providerTransactions]) => {
      const total = providerTransactions.length;
      const completed = providerTransactions.filter(t => t.status === 'completed').length;
      
      providers[provider] = {
        successRate: formatterUtil.formatPercentage(total > 0 ? completed / total : 0),
        totalTransactions: total,
        completedTransactions: completed
      };
    });
    
    return providers;
  }

  /**
   * Helper method to calculate processing fees
   */
  _calculateProcessingFees(transactions) {
    return transactions.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.amount);
      
      // Apply different fee structures based on provider
      if (transaction.provider === 'stripe') {
        // Stripe: 2.9% + $0.30
        return sum + (amount * 0.029 + 0.30);
      } else if (transaction.provider === 'paypal') {
        // PayPal: 3.49% + $0.49
        return sum + (amount * 0.0349 + 0.49);
      }
      
      // Default fee structure
      return sum + (amount * 0.03 + 0.30);
    }, 0);
  }

  /**
   * Helper method to aggregate data by month
   */
  _aggregateByMonth(dailyData) {
    const monthlyData = dailyData.reduce((months, day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          totalAmount: 0,
          processingFees: 0,
          netRevenue: 0,
          transactionCount: 0
        };
      }
      
      // Add raw net revenue
      months[monthKey].netRevenue += day.rawNetRevenue;
      months[monthKey].transactionCount += day.transactionCount;
      
      return months;
    }, {});
    
    // Format currency values and sort by month
    return Object.values(monthlyData)
      .map(month => ({
        ...month,
        netRevenue: formatterUtil.formatCurrency(month.netRevenue)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

module.exports = new AnalyticsService();