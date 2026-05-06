const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru').then(async () => {
  const db = mongoose.connection.db;
  
  const siswas = await db.collection('siswas').find().toArray();
  let fixed = 0;
  
  for (const s of siswas) {
    // Hapus semua whitespace, newline, carriage return, tab
    const kelasBersih = (s.kelas || '').replace(/[\r\n\t\s]+$/, '').replace(/^[\r\n\t\s]+/, '');
    
    if (kelasBersih !== s.kelas) {
      console.log(`Fixing "${s.nama}": [${[...s.kelas].map(c => c.charCodeAt(0)).join(',')}]`);
      await db.collection('siswas').updateOne(
        { _id: s._id },
        { $set: { kelas: kelasBersih } }
      );
      fixed++;
    }
  }
  
  console.log(`\nTotal fixed: ${fixed} siswa`);
  
  // Verifikasi
  const sample = await db.collection('siswas').find().limit(3).toArray();
  console.log('\nVerifikasi setelah fix:');
  sample.forEach(s => {
    const codes = [...(s.kelas || '')].map(c => c.charCodeAt(0));
    console.log(` - ${s.nama} | kelas: "${s.kelas}" | codes: [${codes.join(',')}]`);
  });
  
  mongoose.connection.close();
});
