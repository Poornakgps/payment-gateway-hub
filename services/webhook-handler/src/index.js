const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../shared/lib/errors');
const logger = require('../../shared/lib/logger');
const webhookRoutes = require('./routes/webhook.routes');
const config = require('./config');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'webhook-handler' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 3002;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Webhook Handler Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;