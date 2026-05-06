const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru').then(async () => {
  const db = mongoose.connection.db;
  
  const total = await db.collection('nilais').countDocuments();
  console.log('Total nilai di DB:', total);
  
  // Cek per semester dan tahun ajaran
  const bySemester = await db.collection('nilais').aggregate([
    { $group: { _id: { semester: '$semester', tahunAjaran: '$tahunAjaran' }, count: { $sum: 1 } } },
    { $sort: { '_id.tahunAjaran': 1 } }
  ]).toArray();
  
  console.log('\nPer semester:');
  bySemester.forEach(b => {
    console.log(` - ${b._id.semester || 'null'} ${b._id.tahunAjaran || 'null'}: ${b.count} record`);
  });
  
  // Cek nilai dengan UH/PTS/PAS yang sudah diisi
  const denganNilai = await db.collection('nilais').countDocuments({
    $or: [
      { 'pengetahuan.uh': { $gt: 0 } },
      { 'pengetahuan.pts': { $gt: 0 } },
      { 'pengetahuan.pas': { $gt: 0 } }
    ]
  });
  console.log('\nNilai yang sudah diisi (UH/PTS/PAS > 0):', denganNilai);
  
  // Sample data
  const sample = await db.collection('nilais').find().limit(3).toArray();
  console.log('\nSample data:');
  sample.forEach(n => console.log(' -', JSON.stringify(n).substring(0, 150)));
  
  mongoose.connection.close();
});
