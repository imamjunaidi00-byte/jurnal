const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru').then(async () => {
  const db = mongoose.connection.db;
  
  // Ambil semua siswa
  const siswas = await db.collection('siswas').find().toArray();
  let fixed = 0;
  
  for (const s of siswas) {
    const kelasTrimmed = (s.kelas || '').trim();
    if (kelasTrimmed !== s.kelas) {
      await db.collection('siswas').updateOne(
        { _id: s._id },
        { $set: { kelas: kelasTrimmed } }
      );
      console.log(`Fixed: "${s.nama}" kelas "${s.kelas}" -> "${kelasTrimmed}"`);
      fixed++;
    }
  }
  
  console.log(`\nTotal fixed: ${fixed} siswa`);
  
  // Verifikasi
  const sample = await db.collection('siswas').find().limit(3).toArray();
  console.log('\nVerifikasi:');
  sample.forEach(s => console.log(` - ${s.nama} | kelas: "${s.kelas}"`));
  
  mongoose.connection.close();
});
