const { v4: uuidv4 } = require('uuid');
const parser = require('cron-parser');
const { Job, Queue, ScheduledJob, DeadLetterQueue } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Creates a single job of any kind (immediate / delayed / scheduled / recurring).
 * Recurring jobs also get a ScheduledJob template row so the scheduler sweep
 * can materialize future occurrences.
 */
const createJob = async ({ queue_id, type, payload, job_kind, run_at, cron_expression, priority, max_attempts }) => {
  const queue = await Queue.findByPk(queue_id);
  if (!queue) throw new ApiError(404, 'Queue not found');

  const kind = job_kind || 'immediate';
  let status = 'queued';
  let resolvedRunAt = null;

  if (kind === 'delayed' || kind === 'scheduled') {
    if (!run_at) throw new ApiError(422, `run_at is required for ${kind} jobs`);
    resolvedRunAt = new Date(run_at);
    status = 'scheduled';
  }

  if (kind === 'recurring') {
    if (!cron_expression) throw new ApiError(422, 'cron_expression is required for recurring jobs');
    let interval;
    try {
      interval = parser.parseExpression(cron_expression);
    } catch (err) {
      throw new ApiError(422, `Invalid cron expression: ${err.message}`);
    }
    resolvedRunAt = interval.next().toDate();
    status = 'scheduled';

    await ScheduledJob.create({
      queue_id,
      type,
      payload: payload || {},
      cron_expression,
      next_run_at: resolvedRunAt,
      is_active: true
    });
  }

  const job = await Job.create({
    queue_id,
    type,
    payload: payload || {},
    job_kind: kind,
    status,
    priority: priority ?? queue.priority,
    run_at: resolvedRunAt,
    cron_expression: kind === 'recurring' ? cron_expression : null,
    max_attempts: max_attempts ?? 3
  });

  return job;
};

/**
 * Creates many jobs sharing a batch_id in a single call so the frontend and
 * worker can group and report on them together.
 */
const createBatch = async ({ queue_id, type, items, priority, max_attempts }) => {
  const queue = await Queue.findByPk(queue_id);
  if (!queue) throw new ApiError(404, 'Queue not found');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'items must be a non-empty array of payload objects');
  }

  const batch_id = uuidv4();
  const rows = items.map((payload) => ({
    queue_id,
    type,
    payload: payload || {},
    job_kind: 'batch',
    status: 'queued',
    priority: priority ?? queue.priority,
    batch_id,
    max_attempts: max_attempts ?? 3
  }));

  const jobs = await Job.bulkCreate(rows, { returning: true });
  return { batch_id, count: jobs.length, jobs };
};

/**
 * Re-queues a job that landed in the Dead Letter Queue, resetting its
 * attempt counter so the retry policy applies fresh.
 */
const retryDeadLetterJob = async (dlqId) => {
  const entry = await DeadLetterQueue.findByPk(dlqId);
  if (!entry) throw new ApiError(404, 'Dead letter entry not found');

  const job = await Job.findByPk(entry.job_id);
  if (!job) throw new ApiError(404, 'Original job no longer exists');

  await job.update({
    status: 'queued',
    attempts: 0,
    claimed_by: null,
    claimed_at: null,
    started_at: null,
    completed_at: null,
    last_error: null,
    run_at: null
  });

  await entry.update({ resolved: true });
  return job;
};

module.exports = { createJob, createBatch, retryDeadLetterJob };
