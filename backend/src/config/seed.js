require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Project, RetryPolicy, Queue } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const [user] = await User.findOrCreate({
      where: { email: 'demo@scheduler.local' },
      defaults: {
        name: 'Demo Admin',
        email: 'demo@scheduler.local',
        password_hash: passwordHash,
        role: 'admin'
      }
    });

    const [project] = await Project.findOrCreate({
      where: { name: 'Demo Project', owner_id: user.id },
      defaults: {
        name: 'Demo Project',
        description: 'Seeded sample project for exploring the dashboard.',
        owner_id: user.id
      }
    });

    const [retryPolicy] = await RetryPolicy.findOrCreate({
      where: { name: 'Default Exponential' },
      defaults: {
        name: 'Default Exponential',
        strategy: 'exponential',
        max_attempts: 5,
        base_delay_ms: 1000,
        max_delay_ms: 30000
      }
    });

    await Queue.findOrCreate({
      where: { project_id: project.id, name: 'default' },
      defaults: {
        project_id: project.id,
        name: 'default',
        priority: 5,
        concurrency_limit: 5,
        retry_policy_id: retryPolicy.id,
        status: 'active'
      }
    });

    console.log('Seed complete. Login with demo@scheduler.local / Password123!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
