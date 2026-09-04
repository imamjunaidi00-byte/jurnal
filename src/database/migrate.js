'use strict';

/**
 * Database Migration Script
 * Jalankan: node src/database/migrate.js
 * Reset:    node src/database/migrate.js --reset
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
// Import models supaya terdaftar ke sequelize instance
require('../models/index');

const isReset = process.argv.includes('--reset');

async function migrate() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected.');

    if (isReset) {
      console.log('⚠️  RESET MODE: Dropping all tables...');
      await sequelize.drop();
      console.log('✅ All tables dropped.');
    }

    console.log('🔄 Syncing tables (ALTER safe)...');
    await sequelize.sync({ alter: !isReset, force: isReset });
    console.log('✅ All tables synced successfully.');

    // Seed default app identity jika belum ada
    const { AppSetting } = require('../models/index');
    const existing = await AppSetting.findOne({ where: { key: 'identity' } });
    if (!existing) {
      await AppSetting.create({
        key: 'identity',
        value: {
          name:    'E-Journal SMK',
          tagline: 'Sistem Jurnal Digital Guru',
          logo:    '',
        },
      });
      console.log('✅ Default app identity created.');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 Next: Create admin account with  node src/database/seed.js');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

migrate();
