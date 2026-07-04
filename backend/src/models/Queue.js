const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Queue extends Model {}

Queue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5 // 1 = highest, 10 = lowest
    },
    concurrency_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    retry_policy_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'paused'),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    sequelize,
    modelName: 'Queue',
    tableName: 'queues',
    indexes: [
      { fields: ['project_id'] },
      { unique: true, fields: ['project_id', 'name'] }
    ]
  }
);

module.exports = Queue;
