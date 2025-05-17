const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./index');
const { PAYMENT_PROVIDERS } = require('../../../shared/constants/payment-providers');

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM,
      values: [
        'initiated', 
        'processing', 
        'completed', 
        'failed', 
        'refunded', 
        'partially_refunded',
        'canceled'
      ],
      defaultValue: 'initiated',
      allowNull: false,
    },
    provider: {
      type: DataTypes.ENUM,
      values: Object.values(PAYMENT_PROVIDERS),
      allowNull: false,
    },
    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'transaction',
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['provider'],
      },
      {
        fields: ['customerId'],
      },
      {
        fields: ['providerTransactionId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

module.exports = Transaction;