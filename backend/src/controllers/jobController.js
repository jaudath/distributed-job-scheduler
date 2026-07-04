const { Job, Queue, JobExecution, JobLog } = require('../models');
const jobService = require('../services/jobService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.body);
  return success(res, job, 'Job created', 201);
});

const createBatch = asyncHandler(async (req, res) => {
  const result = await jobService.createBatch(req.body);
  return success(res, result, 'Batch created', 201);
});

const listJobs = asyncHandler(async (req, res) => {
  const { queueId, status, jobKind, batchId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (queueId) where.queue_id = queueId;
  if (status) where.status = status;
  if (jobKind) where.job_kind = jobKind;
  if (batchId) where.batch_id = batchId;

  const offset = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);

  const { rows, count } = await Job.findAndCountAll({
    where,
    include: [{ model: Queue, attributes: ['id', 'name', 'project_id'] }],
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

const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id, {
    include: [
      { model: Queue },
      { model: JobExecution, include: [{ model: JobLog }] },
      { model: JobLog }
    ]
  });
  if (!job) throw new ApiError(404, 'Job not found');
  return success(res, job);
});

const cancelJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');

  if (['completed', 'dead_letter', 'cancelled'].includes(job.status)) {
    throw new ApiError(409, `Cannot cancel a job with status "${job.status}"`);
  }

  await job.update({ status: 'cancelled' });
  return success(res, job, 'Job cancelled');
});

module.exports = { createJob, createBatch, listJobs, getJob, cancelJob };
