const { Job, WorkerNode, Queue, DeadLetterQueue, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const STALE_MS = 30000;

const systemMetrics = asyncHandler(async (req, res) => {
  const jobRows = await Job.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true
  });

  const jobCounts = { queued: 0, scheduled: 0, claimed: 0, running: 0, completed: 0, failed: 0, dead_letter: 0, cancelled: 0 };
  jobRows.forEach((r) => {
    jobCounts[r.status] = parseInt(r.count, 10);
  });

  const totalQueues = await Queue.count();
  const activeQueues = await Queue.count({ where: { status: 'active' } });
  const pausedQueues = totalQueues - activeQueues;

  const totalWorkers = await WorkerNode.count();
  const now = new Date(Date.now() - STALE_MS);
  const onlineWorkers = await WorkerNode.count({ where: { last_seen_at: { [sequelize.Sequelize.Op.gte]: now } } });

  const pendingDlq = await DeadLetterQueue.count({ where: { resolved: false } });

  // Throughput: jobs completed in the last hour, bucketed by 10 minutes would
  // need raw SQL; keep this simple and portable across MySQL versions.
  const completedLastHour = await Job.count({
    where: {
      status: 'completed',
      completed_at: { [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });

  return success(res, {
    jobs: jobCounts,
    queues: { total: totalQueues, active: activeQueues, paused: pausedQueues },
    workers: { total: totalWorkers, online: onlineWorkers, offline: totalWorkers - onlineWorkers },
    deadLetterQueue: { pending: pendingDlq },
    throughput: { completedLastHour }
  });
});

module.exports = { systemMetrics };
