require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const queueRoutes = require('./routes/queueRoutes');
const retryPolicyRoutes = require('./routes/retryPolicyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const workerRoutes = require('./routes/workerRoutes');
const dlqRoutes = require('./routes/dlqRoutes');
const logRoutes = require('./routes/logRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/retry-policies', retryPolicyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/dlq', dlqRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
