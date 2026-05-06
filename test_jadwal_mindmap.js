const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru';

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Cek jadwal
    const jadwalCount = await db.collection('jadwals').countDocuments();
    console.log(`\n📅 Jadwal: ${jadwalCount} dokumen`);
    
    if (jadwalCount > 0) {
      const jadwalSample = await db.collection('jadwals').find().limit(3).toArray();
      console.log('Sample jadwal:');
      jadwalSample.forEach(j => {
        console.log(`  - ${j.hari} ${j.jamMulai}-${j.jamSelesai}: ${j.mataPelajaran} (${j.kelas}) - ${j.semester} ${j.tahunAjaran}`);
      });
    }
    
    // Cek mind map
    const mindmapCount = await db.collection('mindmaps').countDocuments();
    console.log(`\n🧠 Mind Map: ${mindmapCount} dokumen`);
    
    if (mindmapCount > 0) {
      const mindmapSample = await db.collection('mindmaps').find().limit(3).toArray();
      console.log('Sample mind map:');
      mindmapSample.forEach(m => {
        console.log(`  - ${m.judul} (${m.mataPelajaran || 'no mapel'}) - ${m.kelas || 'no kelas'}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Test selesai');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

test();
