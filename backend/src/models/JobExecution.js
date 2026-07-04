const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobExecution extends Model {}

JobExecution.init(
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
    worker_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('running', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'running'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'JobExecution',
    tableName: 'job_executions',
    indexes: [{ fields: ['job_id'] }, { fields: ['worker_id'] }]
  }
);

module.exports = JobExecution;
