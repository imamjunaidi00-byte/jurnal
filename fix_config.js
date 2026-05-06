const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru';

async function fixConfig() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Update semua profil yang ada untuk menggunakan semester dan tahun ajaran yang benar
    const result = await db.collection('profils').updateMany(
      {},
      {
        $set: {
          semester: 'Genap',
          tahunAjaran: '2025/2026'
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} profil documents`);
    
    // Cek profil yang ada
    const profils = await db.collection('profils').find().toArray();
    console.log('\nProfil di database:');
    profils.forEach(p => {
      console.log(`  - ${p.guru?.nama || 'No name'}: ${p.semester} ${p.tahunAjaran}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Selesai');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

fixConfig();
