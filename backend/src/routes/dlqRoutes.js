const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { listDeadLetters, retryDeadLetter } = require('../controllers/dlqController');

const router = express.Router();
router.use(authenticate);

router.get('/', listDeadLetters);
router.post('/:id/retry', retryDeadLetter);

module.exports = router;
