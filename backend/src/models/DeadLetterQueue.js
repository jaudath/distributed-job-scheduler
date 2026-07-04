const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { safeJsonGetter } = require('../utils/jsonField');

class DeadLetterQueue extends Model {}

DeadLetterQueue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    queue_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payload_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      get: safeJsonGetter('payload_snapshot')
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'DeadLetterQueue',
    tableName: 'dead_letter_queue',
    indexes: [{ fields: ['job_id'] }, { fields: ['queue_id'] }]
  }
);

module.exports = DeadLetterQueue;
