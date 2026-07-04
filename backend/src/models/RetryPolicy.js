const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RetryPolicy extends Model {
  /** Compute delay (ms) before the next retry attempt given the attempt number (1-based). */
  computeDelayMs(attemptNumber) {
    const base = this.base_delay_ms;
    switch (this.strategy) {
      case 'fixed':
        return base;
      case 'linear':
        return base * attemptNumber;
      case 'exponential':
        return Math.min(base * Math.pow(2, attemptNumber - 1), this.max_delay_ms);
      default:
        return base;
    }
  }
}

RetryPolicy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    strategy: {
      type: DataTypes.ENUM('fixed', 'linear', 'exponential'),
      allowNull: false,
      defaultValue: 'exponential'
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    base_delay_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000
    },
    max_delay_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60000
    }
  },
  {
    sequelize,
    modelName: 'RetryPolicy',
    tableName: 'retry_policies'
  }
);

module.exports = RetryPolicy;
