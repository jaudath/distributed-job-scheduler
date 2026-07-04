const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class WorkerNode extends Model {}

WorkerNode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    worker_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true // stable identifier e.g. hostname-pid-uuid
    },
    hostname: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'draining'),
      allowNull: false,
      defaultValue: 'online'
    },
    concurrency: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WorkerNode',
    tableName: 'workers',
    indexes: [{ unique: true, fields: ['worker_key'] }]
  }
);

module.exports = WorkerNode;
