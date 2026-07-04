const { failure } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return failure(res, message, statusCode, err.errors);
};

const notFound = (req, res) => {
  return failure(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = { errorHandler, notFound };
