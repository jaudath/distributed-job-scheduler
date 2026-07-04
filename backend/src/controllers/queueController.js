const { Queue, Project, Job, RetryPolicy, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const ensureProjectOwnership = async (projectId, userId) => {
  const project = await Project.findOne({ where: { id: projectId, owner_id: userId } });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const listQueues = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const where = {};
  if (projectId) {
    await ensureProjectOwnership(projectId, req.user.id);
    where.project_id = projectId;
  }

  const queues = await Queue.findAll({
    where,
    include: [{ model: RetryPolicy }],
    order: [['created_at', 'DESC']]
  });
  return success(res, queues);
});

const createQueue = asyncHandler(async (req, res) => {
  const { project_id, name, priority, concurrency_limit, retry_policy_id } = req.body;
  await ensureProjectOwnership(project_id, req.user.id);

  const queue = await Queue.create({
    project_id,
    name,
    priority: priority ?? 5,
    concurrency_limit: concurrency_limit ?? 5,
    retry_policy_id: retry_policy_id ?? null,
    status: 'active'
  });
  return success(res, queue, 'Queue created', 201);
});

const getQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findByPk(req.params.id, { include: [{ model: RetryPolicy }] });
  if (!queue) throw new ApiError(404, 'Queue not found');
  return success(res, queue);
});

const updateQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findByPk(req.params.id);
  if (!queue) throw new ApiError(404, 'Queue not found');

  const { name, priority, concurrency_limit, retry_policy_id } = req.body;
  await queue.update({
    name: name ?? queue.name,
    priority: priority ?? queue.priority,
    concurrency_limit: concurrency_limit ?? queue.concurrency_limit,
    retry_policy_id: retry_policy_id ?? queue.retry_policy_id
  });
  return success(res, queue, 'Queue updated');
});

const setQueueStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'paused'
  if (!['active', 'paused'].includes(status)) {
    throw new ApiError(422, 'status must be "active" or "paused"');
  }
  const queue = await Queue.findByPk(req.params.id);
  if (!queue) throw new ApiError(404, 'Queue not found');

  await queue.update({ status });
  return success(res, queue, `Queue ${status === 'paused' ? 'paused' : 'resumed'}`);
});

const deleteQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findByPk(req.params.id);
  if (!queue) throw new ApiError(404, 'Queue not found');
  await queue.destroy();
  return success(res, null, 'Queue deleted');
});

const queueStats = asyncHandler(async (req, res) => {
  const queue = await Queue.findByPk(req.params.id);
  if (!queue) throw new ApiError(404, 'Queue not found');

  const rows = await Job.findAll({
    where: { queue_id: queue.id },
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true
  });

  const counts = { queued: 0, scheduled: 0, claimed: 0, running: 0, completed: 0, failed: 0, dead_letter: 0, cancelled: 0 };
  rows.forEach((r) => {
    counts[r.status] = parseInt(r.count, 10);
  });

  return success(res, { queue_id: queue.id, counts });
});

module.exports = {
  listQueues,
  createQueue,
  getQueue,
  updateQueue,
  setQueueStatus,
  deleteQueue,
  queueStats
};
