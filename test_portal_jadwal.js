const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru').then(async () => {
  const db = mongoose.connection.db;
  
  // Simulasi endpoint /api/siswa-portal/jadwal?nisn=xxx
  // Cari siswa ARJUNA (dari screenshot)
  const siswa = await db.collection('siswas').findOne({ nama: /ARJUNA/i });
  console.log('Siswa:', siswa?.nama, '| kelas:', siswa?.kelas, '| nisn:', siswa?.nisn);
  
  if (siswa) {
    // Filter jadwal berdasarkan kelas siswa
    const jadwal = await db.collection('jadwals')
      .find({ kelas: siswa.kelas })
      .sort({ hari: 1, jamMulai: 1 })
      .toArray();
    
    console.log(`\nJadwal untuk kelas "${siswa.kelas}":`);
    jadwal.forEach(j => console.log(' -', j.hari, j.mataPelajaran, j.ruangan));
    console.log('Total:', jadwal.length);
    
    // Cek apakah ada jadwal kelas lain yang bocor
    const semuaJadwal = await db.collection('jadwals').find().toArray();
    const jadwalLain = semuaJadwal.filter(j => j.kelas !== siswa.kelas);
    console.log('\nJadwal kelas lain (seharusnya tidak tampil):');
    jadwalLain.forEach(j => console.log(' -', j.hari, j.mataPelajaran, j.kelas, j.ruangan));
  }
  
  mongoose.connection.close();
});
