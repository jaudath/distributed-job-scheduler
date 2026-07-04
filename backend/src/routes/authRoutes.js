const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters')
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('valid email is required'),
    body('password').notEmpty().withMessage('password is required')
  ]),
  login
);

router.get('/me', authenticate, me);

module.exports = router;
