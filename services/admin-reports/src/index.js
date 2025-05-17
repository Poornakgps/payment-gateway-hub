const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('../../shared/lib/errors');
const logger = require('../../shared/lib/logger');
const reportsRoutes = require('./routes/reports.routes');
const config = require('./config');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin-reports' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 3003;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Admin Reports Service running on port ${PORT}`);
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