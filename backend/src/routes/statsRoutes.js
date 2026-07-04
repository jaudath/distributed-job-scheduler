const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { systemMetrics } = require('../controllers/statsController');

const router = express.Router();
router.use(authenticate);

router.get('/', systemMetrics);

module.exports = router;
