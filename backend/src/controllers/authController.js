const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password_hash, role: 'member' });

  const token = signToken(user);
  return success(
    res,
    { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    'Account created',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const token = signToken(user);
  return success(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  }, 'Logged in');
});

const me = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

module.exports = { register, login, me };
