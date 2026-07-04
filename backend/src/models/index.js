const sequelize = require('../config/database');

const User = require('./User');
const Project = require('./Project');
const RetryPolicy = require('./RetryPolicy');
const Queue = require('./Queue');
const Job = require('./Job');
const WorkerNode = require('./Worker');
const WorkerHeartbeat = require('./WorkerHeartbeat');
const JobExecution = require('./JobExecution');
const JobLog = require('./JobLog');
const ScheduledJob = require('./ScheduledJob');
const DeadLetterQueue = require('./DeadLetterQueue');

// User -> Project (1:N)
User.hasMany(Project, { foreignKey: 'owner_id', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Project -> Queue (1:N)
Project.hasMany(Queue, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Queue.belongsTo(Project, { foreignKey: 'project_id' });

// RetryPolicy -> Queue (1:N)
RetryPolicy.hasMany(Queue, { foreignKey: 'retry_policy_id', onDelete: 'SET NULL' });
Queue.belongsTo(RetryPolicy, { foreignKey: 'retry_policy_id' });

// Queue -> Job (1:N)
Queue.hasMany(Job, { foreignKey: 'queue_id', onDelete: 'CASCADE' });
Job.belongsTo(Queue, { foreignKey: 'queue_id' });

// Queue -> ScheduledJob (1:N)
Queue.hasMany(ScheduledJob, { foreignKey: 'queue_id', onDelete: 'CASCADE' });
ScheduledJob.belongsTo(Queue, { foreignKey: 'queue_id' });

// WorkerNode -> Job (1:N, claimed_by)
WorkerNode.hasMany(Job, { foreignKey: 'claimed_by', as: 'claimedJobs' });
Job.belongsTo(WorkerNode, { foreignKey: 'claimed_by', as: 'worker' });

// WorkerNode -> WorkerHeartbeat (1:N)
WorkerNode.hasMany(WorkerHeartbeat, { foreignKey: 'worker_id', onDelete: 'CASCADE' });
WorkerHeartbeat.belongsTo(WorkerNode, { foreignKey: 'worker_id' });

// Job -> JobExecution (1:N)
Job.hasMany(JobExecution, { foreignKey: 'job_id', onDelete: 'CASCADE' });
JobExecution.belongsTo(Job, { foreignKey: 'job_id' });
WorkerNode.hasMany(JobExecution, { foreignKey: 'worker_id' });
JobExecution.belongsTo(WorkerNode, { foreignKey: 'worker_id' });

// Job -> JobLog (1:N)
Job.hasMany(JobLog, { foreignKey: 'job_id', onDelete: 'CASCADE' });
JobLog.belongsTo(Job, { foreignKey: 'job_id' });
JobExecution.hasMany(JobLog, { foreignKey: 'execution_id' });
JobLog.belongsTo(JobExecution, { foreignKey: 'execution_id' });

// Job -> DeadLetterQueue (1:1-ish, N allowed for history)
Job.hasMany(DeadLetterQueue, { foreignKey: 'job_id', onDelete: 'CASCADE' });
DeadLetterQueue.belongsTo(Job, { foreignKey: 'job_id' });
Queue.hasMany(DeadLetterQueue, { foreignKey: 'queue_id', onDelete: 'CASCADE' });
DeadLetterQueue.belongsTo(Queue, { foreignKey: 'queue_id' });

module.exports = {
  sequelize,
  User,
  Project,
  RetryPolicy,
  Queue,
  Job,
  WorkerNode,
  WorkerHeartbeat,
  JobExecution,
  JobLog,
  ScheduledJob,
  DeadLetterQueue
};
