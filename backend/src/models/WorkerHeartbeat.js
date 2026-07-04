const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class WorkerHeartbeat extends Model {}

WorkerHeartbeat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    worker_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    active_jobs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    cpu_load: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    memory_mb: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WorkerHeartbeat',
    tableName: 'worker_heartbeats',
    indexes: [{ fields: ['worker_id'] }, { fields: ['created_at'] }]
  }
);

module.exports = WorkerHeartbeat;
