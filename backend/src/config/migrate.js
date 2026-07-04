require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // { alter: true } brings the schema in line with the models without
    // dropping existing data. Use { force: true } for a full reset in dev.
    await sequelize.sync({ alter: true });

    console.log('All tables synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
