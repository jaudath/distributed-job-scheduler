const { WorkerNode, WorkerHeartbeat, Job } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

// A worker is considered offline if no heartbeat was seen in this window.
const STALE_MS = 30000;

const listWorkers = asyncHandler(async (req, res) => {
  const workers = await WorkerNode.findAll({ order: [['last_seen_at', 'DESC']] });

  const now = Date.now();
  const withComputedStatus = workers.map((w) => {
    const plain = w.toJSON();
    const lastSeen = plain.last_seen_at ? new Date(plain.last_seen_at).getTime() : 0;
    plain.status = now - lastSeen > STALE_MS ? 'offline' : plain.status;
    return plain;
  });

  return success(res, withComputedStatus);
});

const getWorker = asyncHandler(async (req, res) => {
  const worker = await WorkerNode.findByPk(req.params.id, {
    include: [{ model: WorkerHeartbeat, limit: 20, order: [['created_at', 'DESC']] }]
  });
  if (!worker) throw new ApiError(404, 'Worker not found');

  const activeJobs = await Job.count({ where: { claimed_by: worker.id, status: 'running' } });

  return success(res, { ...worker.toJSON(), activeJobs });
});

module.exports = { listWorkers, getWorker };
