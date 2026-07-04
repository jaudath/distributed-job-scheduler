const ApiError = require('../utils/ApiError');
const { error: errorResponse } = require('../utils/apiResponse');

/**
 * Converts unknown/thrown errors into a consistent ApiError shape.
 */
function errorConverter(err, req, res, next) {
  let convertedError = err;

  if (!(convertedError instanceof ApiError)) {
    const statusCode = convertedError.statusCode || 500;
    const message = convertedError.message || 'Internal server error';
    convertedError = new ApiError(statusCode, message, convertedError.errors || null);
  }

  next(convertedError);
}

/**
 * Final error handler. Must be registered last, after all routes.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors: err.errors || undefined,
  });
}

/**
 * Wraps a 404 for unmatched routes into the ApiError flow.
 */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorConverter, errorHandler, notFoundHandler };
