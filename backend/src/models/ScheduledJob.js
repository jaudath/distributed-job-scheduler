const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { safeJsonGetter } = require('../utils/jsonField');

/**
 * Template used to spawn recurring/scheduled Job rows.
 * A background sweep (services/schedulerService.js) reads active
 * ScheduledJob rows and materializes new Job rows when they are due.
 */
class ScheduledJob extends Model {}

ScheduledJob.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    queue_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      get: safeJsonGetter('payload')
    },
    cron_expression: {
      type: DataTypes.STRING(100),
      allowNull: true // null => one-off scheduled job using run_at
    },
    run_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_run_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'ScheduledJob',
    tableName: 'scheduled_jobs',
    indexes: [{ fields: ['queue_id'] }, { fields: ['next_run_at'] }]
  }
);

module.exports = ScheduledJob;
