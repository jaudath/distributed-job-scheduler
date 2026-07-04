require('dotenv').config({ path: require('path').join(__dirname, '..', '..', 'backend', '.env') });
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const {
  sequelize,
  Job,
  Queue,
  RetryPolicy,
  WorkerNode,
  WorkerHeartbeat,
  JobExecution,
  JobLog,
  DeadLetterQueue
} = require('../../backend/src/models');
const { runHandler } = require('./handlers');
const { runSchedulerSweep } = require('./scheduler');

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS, 10) || 2000;
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.WORKER_HEARTBEAT_INTERVAL_MS, 10) || 10000;
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY, 10) || 4;

const WORKER_KEY = `${os.hostname()}-${process.pid}-${uuidv4().slice(0, 8)}`;

let workerRecord = null;
let isShuttingDown = false;
let pollTimer = null;
let heartbeatTimer = null;
let schedulerTimer = null;
const activeExecutions = new Map(); // job id -> Promise

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const registerWorker = async () => {
  workerRecord = await WorkerNode.create({
    worker_key: WORKER_KEY,
    hostname: os.hostname(),
    status: 'online',
    concurrency: CONCURRENCY,
    last_seen_at: new Date()
  });
  console.log(`[worker] registered as ${WORKER_KEY} (id=${workerRecord.id}, concurrency=${CONCURRENCY})`);
};

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

const sendHeartbeat = async () => {
  if (!workerRecord) return;
  try {
    const memoryMb = process.memoryUsage().rss / (1024 * 1024);
    const load = os.loadavg()[0];

    await workerRecord.update({ last_seen_at: new Date(), status: isShuttingDown ? 'draining' : 'online' });
    await WorkerHeartbeat.create({
      worker_id: workerRecord.id,
      active_jobs: activeExecutions.size,
      cpu_load: load,
      memory_mb: memoryMb
    });
  } catch (err) {
    console.error('[worker] heartbeat failed:', err.message);
  }
};

// ---------------------------------------------------------------------------
// Atomic claiming
// ---------------------------------------------------------------------------

/**
 * Claims up to `capacity` queued jobs across all active queues in one
 * transaction, honoring each queue's concurrency_limit and priority order.
 * Uses SELECT ... FOR UPDATE SKIP LOCKED so multiple worker processes never
 * claim the same job twice.
 */
const claimJobs = async (capacity) => {
  if (capacity <= 0) return [];

  const t = await sequelize.transaction();
  const claimed = [];
  try {
    const candidates = await Job.findAll({
      where: { status: 'queued' },
      include: [{ model: Queue, where: { status: 'active' }, required: true }],
      order: [
        ['priority', 'ASC'],
        ['created_at', 'ASC']
      ],
      limit: Math.max(capacity * 4, 10),
      lock: t.LOCK.UPDATE,
      skipLocked: true,
      transaction: t
    });

    const runningCountByQueue = {};

    for (const job of candidates) {
      if (claimed.length >= capacity) break;

      const queueId = job.queue_id;
      if (runningCountByQueue[queueId] === undefined) {
        // eslint-disable-next-line no-await-in-loop
        runningCountByQueue[queueId] = await Job.count({
          where: { queue_id: queueId, status: ['running', 'claimed'] },
          transaction: t
        });
      }

      if (runningCountByQueue[queueId] >= job.Queue.concurrency_limit) continue;

      // eslint-disable-next-line no-await-in-loop
      await job.update(
        { status: 'claimed', claimed_by: workerRecord.id, claimed_at: new Date() },
        { transaction: t }
      );
      runningCountByQueue[queueId] += 1;
      claimed.push(job);
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error('[worker] claim transaction failed:', err.message);
  }

  return claimed;
};

// ---------------------------------------------------------------------------
// Execution + retry handling
// ---------------------------------------------------------------------------

const logMessage = async (jobId, executionId, level, message) => {
  await JobLog.create({ job_id: jobId, execution_id: executionId, level, message });
};

const moveToDeadLetter = async (job) => {
  await job.update({ status: 'dead_letter' });
  await DeadLetterQueue.create({
    job_id: job.id,
    queue_id: job.queue_id,
    reason: job.last_error || 'Max retry attempts exceeded',
    total_attempts: job.attempts,
    payload_snapshot: job.payload
  });
};

const scheduleRetry = async (job, queue) => {
  let policy = null;
  if (queue.retry_policy_id) {
    policy = await RetryPolicy.findByPk(queue.retry_policy_id);
  }

  const strategy = policy?.strategy || 'exponential';
  const baseDelay = policy?.base_delay_ms || 1000;
  const maxDelay = policy?.max_delay_ms || 60000;

  let delayMs;
  if (strategy === 'fixed') delayMs = baseDelay;
  else if (strategy === 'linear') delayMs = baseDelay * job.attempts;
  else delayMs = Math.min(baseDelay * Math.pow(2, job.attempts - 1), maxDelay);

  const runAt = new Date(Date.now() + delayMs);
  await job.update({ status: 'scheduled', run_at: runAt, claimed_by: null, claimed_at: null });

  return { strategy, delayMs, runAt };
};

const executeJob = async (job) => {
  const queue = job.Queue || (await Queue.findByPk(job.queue_id));
  const attemptNumber = job.attempts + 1;

  await job.update({ status: 'running', started_at: new Date(), attempts: attemptNumber });

  const execution = await JobExecution.create({
    job_id: job.id,
    worker_id: workerRecord.id,
    attempt_number: attemptNumber,
    status: 'running',
    started_at: new Date()
  });

  await logMessage(job.id, execution.id, 'info', `Attempt ${attemptNumber} started on worker ${WORKER_KEY}`);

  const startedAt = Date.now();
  try {
    const result = await runHandler(job);
    const durationMs = Date.now() - startedAt;

    await execution.update({ status: 'success', finished_at: new Date(), duration_ms: durationMs });
    await job.update({ status: 'completed', completed_at: new Date(), result, last_error: null });
    await logMessage(job.id, execution.id, 'info', `Completed successfully in ${durationMs}ms`);
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    await execution.update({
      status: 'failed',
      finished_at: new Date(),
      duration_ms: durationMs,
      error_message: err.message
    });
    await job.update({ last_error: err.message });
    await logMessage(job.id, execution.id, 'error', `Attempt ${attemptNumber} failed: ${err.message}`);

    const maxAttempts = job.max_attempts || 3;
    if (attemptNumber >= maxAttempts) {
      await moveToDeadLetter(job);
      await logMessage(job.id, execution.id, 'error', `Moved to Dead Letter Queue after ${attemptNumber} attempts`);
    } else {
      const { strategy, delayMs, runAt } = await scheduleRetry(job, queue);
      await logMessage(
        job.id,
        execution.id,
        'warn',
        `Retry scheduled (${strategy}) in ${delayMs}ms at ${runAt.toISOString()}`
      );
    }
  }
};

// ---------------------------------------------------------------------------
// Poll loop
// ---------------------------------------------------------------------------

const pollOnce = async () => {
  if (isShuttingDown) return;

  const capacity = CONCURRENCY - activeExecutions.size;
  if (capacity <= 0) return;

  const jobs = await claimJobs(capacity);
  jobs.forEach((job) => {
    const promise = executeJob(job)
      .catch((err) => console.error(`[worker] unhandled error executing job ${job.id}:`, err))
      .finally(() => activeExecutions.delete(job.id));
    activeExecutions.set(job.id, promise);
  });

  if (jobs.length) {
    console.log(`[worker] claimed ${jobs.length} job(s); active=${activeExecutions.size}/${CONCURRENCY}`);
  }
};

const scheduleNextPoll = () => {
  pollTimer = setTimeout(async () => {
    try {
      await pollOnce();
    } catch (err) {
      console.error('[worker] poll cycle failed:', err.message);
    }
    if (!isShuttingDown) scheduleNextPoll();
  }, POLL_INTERVAL_MS);
};

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[worker] received ${signal}, draining ${activeExecutions.size} active job(s)...`);

  clearTimeout(pollTimer);
  clearInterval(heartbeatTimer);
  clearInterval(schedulerTimer);

  if (workerRecord) await workerRecord.update({ status: 'draining' });

  await Promise.allSettled(Array.from(activeExecutions.values()));

  if (workerRecord) await workerRecord.update({ status: 'offline', last_seen_at: new Date() });
  console.log('[worker] all active jobs finished. Shutting down cleanly.');

  await sequelize.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[worker] database connection established.');

    await registerWorker();

    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    schedulerTimer = setInterval(() => {
      runSchedulerSweep().catch((err) => console.error('[scheduler] sweep failed:', err.message));
    }, POLL_INTERVAL_MS);

    await sendHeartbeat();
    scheduleNextPoll();

    console.log(`[worker] polling every ${POLL_INTERVAL_MS}ms, heartbeat every ${HEARTBEAT_INTERVAL_MS}ms`);
  } catch (err) {
    console.error('[worker] failed to start:', err);
    process.exit(1);
  }
})();
