const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { safeJsonGetter } = require('../utils/jsonField');

class Job extends Model {}

Job.init(
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
      allowNull: false // e.g. "send_email", "generate_report"
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      get: safeJsonGetter('payload')
    },
    job_kind: {
      type: DataTypes.ENUM('immediate', 'delayed', 'scheduled', 'recurring', 'batch'),
      allowNull: false,
      defaultValue: 'immediate'
    },
    status: {
      type: DataTypes.ENUM(
        'queued',
        'scheduled',
        'claimed',
        'running',
        'completed',
        'failed',
        'dead_letter',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'queued'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    run_at: {
      type: DataTypes.DATE,
      allowNull: true // used for delayed/scheduled jobs
    },
    cron_expression: {
      type: DataTypes.STRING(100),
      allowNull: true // used for recurring jobs
    },
    batch_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    claimed_by: {
      type: DataTypes.INTEGER,
      allowNull: true // worker id
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
      get: safeJsonGetter('result')
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs',
    indexes: [
      { fields: ['queue_id'] },
      { fields: ['status'] },
      { fields: ['queue_id', 'status', 'run_at'] },
      { fields: ['batch_id'] }
    ]
  }
);

module.exports = Job;
