const analyticsService = require('../services/analytics.service');
const logger = require('../../../shared/lib/logger');
const { ValidationError } = require('../../../shared/lib/errors');

class ReportsController {
  /**
   * Get transaction volume report
   */
  async getTransactionVolume(req, res) {
    try {
      // Extract and validate date range
      const { fromDate, toDate } = this._validateDateRange(req.query);
      
      // Additional filters
      const filters = {
        fromDate,
        toDate,
        provider: req.query.provider,
        status: req.query.status,
        customerId: req.query.customerId
      };
      
      // Generate report
      const report = await analyticsService.getTransactionVolume(filters);
      
      res.status(200).json({
        success: true,
        data: report,
        filters
      });
    } catch (error) {
      logger.error('Error in transaction volume report:', error);
      throw error;
    }
  }

  /**
   * Get provider distribution report
   */
  async getProviderDistribution(req, res) {
    try {
      // Extract and validate date range
      const { fromDate, toDate } = this._validateDateRange(req.query);
      
      // Additional filters
      const filters = {
        fromDate,
        toDate,
        status: req.query.status,
        customerId: req.query.customerId
      };
      
      // Generate report
      const report = await analyticsService.getProviderDistribution(filters);
      
      res.status(200).json({
        success: true,
        data: report,
        filters
      });
    } catch (error) {
      logger.error('Error in provider distribution report:', error);
      throw error;
    }
  }

  /**
   * Get success rates report
   */
  async getSuccessRates(req, res) {
    try {
      // Extract and validate date range
      const { fromDate, toDate } = this._validateDateRange(req.query);
      
      // Additional filters
      const filters = {
        fromDate,
        toDate,
        provider: req.query.provider,
        customerId: req.query.customerId
      };
      
      // Generate report
      const report = await analyticsService.getSuccessRates(filters);
      
      res.status(200).json({
        success: true,
        data: report,
        filters
      });
    } catch (error) {
      logger.error('Error in success rates report:', error);
      throw error;
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(req, res) {
    try {
      // Extract and validate date range
      const { fromDate, toDate } = this._validateDateRange(req.query);
      
      // Additional filters
      const filters = {
        fromDate,
        toDate,
        provider: req.query.provider,
        customerId: req.query.customerId
      };
      
      // Generate report
      const report = await analyticsService.getRevenueReport(filters);
      
      res.status(200).json({
        success: true,
        data: report,
        filters
      });
    } catch (error) {
      logger.error('Error in revenue report:', error);
      throw error;
    }
  }

  /**
   * Helper to validate date range in reports
   */
  _validateDateRange(query) {
    const now = new Date();
    
    // Default to last 30 days if not specified
    let fromDate = query.fromDate 
      ? new Date(query.fromDate) 
      : new Date(now.setDate(now.getDate() - 30));
    
    let toDate = query.toDate 
      ? new Date(query.toDate) 
      : new Date();
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new ValidationError('Invalid date format');
    }
    
    // Ensure fromDate is before toDate
    if (fromDate > toDate) {
      throw new ValidationError('From date must be before to date');
    }
    
    // Limit the date range to configured max
    const dayDiff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24));
    const maxDays = require('../config').reports.maxTimeRangeInDays;
    
    if (dayDiff > maxDays) {
      throw new ValidationError(`Date range cannot exceed ${maxDays} days`);
    }
    
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    };
  }
}

module.exports = new ReportsController();