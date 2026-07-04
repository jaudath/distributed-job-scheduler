const { JobLog, Job } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const listLogs = asyncHandler(async (req, res) => {
  const { jobId, level, page = 1, limit = 50 } = req.query;

  const where = {};
  if (jobId) where.job_id = jobId;
  if (level) where.level = level;

  const offset = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);

  const { rows, count } = await JobLog.findAndCountAll({
    where,
    include: [{ model: Job, attributes: ['id', 'type', 'status', 'queue_id'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  return success(res, rows, 'OK', 200, {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10))
  });
});

module.exports = { listLogs };
