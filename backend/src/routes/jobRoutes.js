const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { createJob, createBatch, listJobs, getJob, cancelJob } = require('../controllers/jobController');

const router = express.Router();
router.use(authenticate);

router.get('/', listJobs);
router.post(
  '/',
  validate([
    body('queue_id').isInt().withMessage('queue_id is required'),
    body('type').trim().notEmpty().withMessage('type is required'),
    body('job_kind')
      .optional()
      .isIn(['immediate', 'delayed', 'scheduled', 'recurring', 'batch'])
      .withMessage('invalid job_kind')
  ]),
  createJob
);
router.post(
  '/batch',
  validate([
    body('queue_id').isInt().withMessage('queue_id is required'),
    body('type').trim().notEmpty().withMessage('type is required'),
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array')
  ]),
  createBatch
);
router.get('/:id', getJob);
router.post('/:id/cancel', cancelJob);

module.exports = router;
