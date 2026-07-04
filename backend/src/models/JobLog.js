const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobLog extends Model {}

JobLog.init(
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
    execution_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    level: {
      type: DataTypes.ENUM('info', 'warn', 'error'),
      allowNull: false,
      defaultValue: 'info'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'JobLog',
    tableName: 'job_logs',
    indexes: [{ fields: ['job_id'] }]
  }
);

module.exports = JobLog;
