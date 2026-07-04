const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { listWorkers, getWorker } = require('../controllers/workerController');

const router = express.Router();
router.use(authenticate);

router.get('/', listWorkers);
router.get('/:id', getWorker);

module.exports = router;
