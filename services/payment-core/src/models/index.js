const { Sequelize } = require('sequelize');
const config = require('../config');

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = {
  sequelize,
  Sequelize
};