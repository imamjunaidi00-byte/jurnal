const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/jurnal_guru');
mongoose.connection.once('open', async () => {
    const db = mongoose.connection.db;
    const jadwals = await db.collection('jadwals').find({}).toArray();
    
    for (const j of jadwals) {
        if (j.kelas && typeof j.kelas === 'object') {
            const kelasDoc = await db.collection('kelas').findOne({ _id: j.kelas });
            const namaKelas = kelasDoc ? kelasDoc.nama : 'Unknown';
            await db.collection('jadwals').updateOne(
                { _id: j._id },
                { $set: { kelas: namaKelas } }
            );
            console.log('Fixed:', j.hari, j.mataPelajaran, '->', namaKelas);
        }
    }
    
    // Verify
    const after = await db.collection('jadwals').find({}).toArray();
    console.log('\nAfter migration:');
    after.forEach(j => console.log(j.hari, '|', j.kelas, '|', j.mataPelajaran));
    
    mongoose.disconnect();
    console.log('Done');
});
