const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru';

// ===== UBAH INI SESUAI KEBUTUHAN =====
const NAMA_LAMA = 'X TKRO 2';
const NAMA_BARU = 'X TKR 2';
// =====================================

async function rename() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');
  const db = mongoose.connection.db;

  const collections = ['siswas', 'absensis', 'nilais', 'sikaps', 'jadwals'];
  let total = 0;

  for (const col of collections) {
    const r = await db.collection(col).updateMany({ kelas: NAMA_LAMA }, { $set: { kelas: NAMA_BARU } });
    if (r.modifiedCount > 0) console.log(`  ${col}: ${r.modifiedCount} updated`);
    total += r.modifiedCount;
  }

  console.log(`\nTotal: ${total} dokumen diperbarui`);
  await mongoose.connection.close();
}

rename().catch(console.error);
