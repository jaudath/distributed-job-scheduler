const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const {
  listRetryPolicies,
  createRetryPolicy,
  updateRetryPolicy,
  deleteRetryPolicy
} = require('../controllers/retryPolicyController');

const router = express.Router();
router.use(authenticate);

router.get('/', listRetryPolicies);
router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('name is required'),
    body('strategy').isIn(['fixed', 'linear', 'exponential']).withMessage('invalid strategy')
  ]),
  createRetryPolicy
);
router.put('/:id', updateRetryPolicy);
router.delete('/:id', deleteRetryPolicy);

module.exports = router;
