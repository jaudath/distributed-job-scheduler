const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const {
  listQueues,
  createQueue,
  getQueue,
  updateQueue,
  setQueueStatus,
  deleteQueue,
  queueStats
} = require('../controllers/queueController');

const router = express.Router();
router.use(authenticate);

router.get('/', listQueues);
router.post(
  '/',
  validate([
    body('project_id').isInt().withMessage('project_id is required'),
    body('name').trim().notEmpty().withMessage('name is required')
  ]),
  createQueue
);
router.get('/:id', getQueue);
router.put('/:id', updateQueue);
router.patch('/:id/status', setQueueStatus);
router.delete('/:id', deleteQueue);
router.get('/:id/stats', queueStats);

module.exports = router;
