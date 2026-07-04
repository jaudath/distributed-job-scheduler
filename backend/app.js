const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/config');
const { errorConverter, errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

// API routes will be mounted here in later steps, e.g.:
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/projects', require('./routes/project.routes'));
// app.use('/api/queues', require('./routes/queue.routes'));
// app.use('/api/jobs', require('./routes/job.routes'));

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handling (must be last)
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
