/**
 * Standardized success response.
 */
function success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Standardized error response.
 */
function error(res, { statusCode = 500, message = 'Something went wrong', errors = null }) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, error };
