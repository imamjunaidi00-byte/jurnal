'use strict';

/**
 * Seed Script — Buat akun admin pertama
 * Jalankan: node src/database/seed.js
 * Atau: ADMIN_USER=admin ADMIN_PASS=rahasia123 node src/database/seed.js
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const { Guru } = require('../models/index');

async function seed() {
  await connectDB();

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'Admin@1234';
  const nama     = process.env.ADMIN_NAMA || 'Administrator';

  const exists = await Guru.findOne({ where: { username } });
  if (exists) {
    console.log(`⚠️  Akun "${username}" sudah ada. Seed dibatalkan.`);
    process.exit(0);
  }

  await Guru.create({ username, password, nama, role: 'admin' });
  console.log('✅ Admin account created:');
  console.log(`   Username : ${username}`);
  console.log(`   Password : ${password}`);
  console.log(`   Nama     : ${nama}`);
  console.log('\n⚠️  SEGERA ganti password setelah login pertama!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
