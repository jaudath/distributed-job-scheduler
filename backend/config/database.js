const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: config.env === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    freezeTableName: false,
  },
  timezone: '+00:00',
});

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[database] Connected to MySQL database "${config.db.name}" at ${config.db.host}:${config.db.port}`);
  } catch (error) {
    console.error('[database] Unable to connect to the database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDatabase };
