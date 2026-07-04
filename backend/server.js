const app = require('./app');
const config = require('./config/config');
const { sequelize, connectDatabase } = require('./config/database');

let server;

async function start() {
  await connectDatabase();

  // Sync is used only in development for convenience.
  // From Step 2 onward, once models exist, this will create/alter tables.
  if (config.env === 'development') {
    await sequelize.sync({ alter: false });
  }

  server = app.listen(config.port, () => {
    console.log(`[server] Distributed Job Scheduler API running on port ${config.port} (${config.env})`);
  });
}

function shutdown(signal) {
  console.log(`[server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await sequelize.close();
        console.log('[server] Database connection closed. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('[server] Error during shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Rejection:', reason);
});

start().catch((err) => {
  console.error('[server] Failed to start server:', err);
  process.exit(1);
});
