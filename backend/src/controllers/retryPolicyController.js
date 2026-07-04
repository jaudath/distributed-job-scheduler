const { RetryPolicy } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const listRetryPolicies = asyncHandler(async (req, res) => {
  const policies = await RetryPolicy.findAll({ order: [['created_at', 'DESC']] });
  return success(res, policies);
});

const createRetryPolicy = asyncHandler(async (req, res) => {
  const { name, strategy, max_attempts, base_delay_ms, max_delay_ms } = req.body;
  const policy = await RetryPolicy.create({
    name,
    strategy,
    max_attempts,
    base_delay_ms,
    max_delay_ms
  });
  return success(res, policy, 'Retry policy created', 201);
});

const updateRetryPolicy = asyncHandler(async (req, res) => {
  const policy = await RetryPolicy.findByPk(req.params.id);
  if (!policy) throw new ApiError(404, 'Retry policy not found');
  await policy.update(req.body);
  return success(res, policy, 'Retry policy updated');
});

const deleteRetryPolicy = asyncHandler(async (req, res) => {
  const policy = await RetryPolicy.findByPk(req.params.id);
  if (!policy) throw new ApiError(404, 'Retry policy not found');
  await policy.destroy();
  return success(res, null, 'Retry policy deleted');
});

module.exports = { listRetryPolicies, createRetryPolicy, updateRetryPolicy, deleteRetryPolicy };
