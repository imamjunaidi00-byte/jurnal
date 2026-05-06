const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru').then(async () => {
  const db = mongoose.connection.db;
  
  const renames = [
    ['X TKRO 1', 'X TKR 1'],
    ['X TKRO 2', 'X TKR 2']
  ];
  
  for (const [lama, baru] of renames) {
    const r = await db.collection('mindmaps').updateMany(
      { kelas: lama },
      { $set: { kelas: baru } }
    );
    if (r.modifiedCount > 0) console.log(`Fixed: "${lama}" -> "${baru}": ${r.modifiedCount} mindmap`);
  }
  
  // Verifikasi
  const all = await db.collection('mindmaps').find().toArray();
  console.log('\nMindmap setelah fix:');
  all.forEach(m => console.log(` - ${m.judul} | kelas: "${m.kelas}"`));
  
  mongoose.connection.close();
  console.log('\nSelesai!');
});
