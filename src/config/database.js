'use strict';

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ejournal_smk',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',          // mysql2 driver, kompatibel MariaDB
    timezone: '+07:00',        // WIB
    logging:  process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max:     parseInt(process.env.DB_POOL_MAX  || '10', 10),
      min:     parseInt(process.env.DB_POOL_MIN  || '2',  10),
      acquire: parseInt(process.env.DB_POOL_ACQ  || '30000', 10),
      idle:    parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
    define: {
      underscored:   false,  // pakai camelCase di model, snake_case di kolom
      freezeTableName: false,
      timestamps:    true,
      createdAt:     'createdAt',
      updatedAt:     'updatedAt',
    },
    dialectOptions: {
      charset:        'utf8mb4',
      dateStrings:    true,
      typeCast:       true,
      connectTimeout: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ MariaDB/MySQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'ejournal_smk'}`);
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
