const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { listLogs } = require('../controllers/logController');

const router = express.Router();
router.use(authenticate);

router.get('/', listLogs);

module.exports = router;
