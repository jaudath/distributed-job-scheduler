const { validationResult } = require('express-validator');
const { failure } = require('../utils/response');

/**
 * Runs an array of express-validator chains, then short-circuits with a
 * 422 response if any of them failed.
 */
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return failure(
    res,
    'Validation failed',
    422,
    errors.array().map((e) => ({ field: e.path, message: e.msg }))
  );
};

module.exports = validate;
