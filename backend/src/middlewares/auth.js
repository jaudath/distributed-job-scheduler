const jwt = require('jsonwebtoken');
const { failure } = require('../utils/response');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return failure(res, 'Authentication token missing', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!user) {
      return failure(res, 'User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return failure(res, 'Invalid or expired token', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return failure(res, 'Admin privileges required', 403);
  }
  next();
};

module.exports = { authenticate, requireAdmin };
