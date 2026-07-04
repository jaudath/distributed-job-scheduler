const { DeadLetterQueue, Job, Queue } = require('../models');
const jobService = require('../services/jobService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const listDeadLetters = asyncHandler(async (req, res) => {
  const { queueId, resolved } = req.query;
  const where = {};
  if (queueId) where.queue_id = queueId;
  if (resolved !== undefined) where.resolved = resolved === 'true';

  const entries = await DeadLetterQueue.findAll({
    where,
    include: [{ model: Job }, { model: Queue, attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']]
  });
  return success(res, entries);
});

const retryDeadLetter = asyncHandler(async (req, res) => {
  const job = await jobService.retryDeadLetterJob(req.params.id);
  return success(res, job, 'Job re-queued for execution');
});

module.exports = { listDeadLetters, retryDeadLetter };
