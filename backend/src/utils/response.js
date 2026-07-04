const success = (res, data = null, message = 'OK', statusCode = 200, meta = undefined) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const failure = (res, message = 'Something went wrong', statusCode = 500, errors = undefined) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, failure };
