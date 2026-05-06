const { MongoClient, ObjectId } = require('mongodb');

async function migrate() {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('jurnal_guru');
    
    const jadwals = await db.collection('jadwals').find({}).toArray();
    const kelasList = await db.collection('kelas').find({}).toArray();
    
    // Build map ObjectId -> nama
    const kelasMap = {};
    kelasList.forEach(k => { kelasMap[k._id.toString()] = k.nama; });
    
    console.log('Kelas map:', kelasMap);
    
    for (const j of jadwals) {
        const kelasId = j.kelas?.toString();
        const namaKelas = kelasMap[kelasId];
        if (namaKelas) {
            // Use native updateOne to bypass Mongoose schema
            await db.collection('jadwals').updateOne(
                { _id: j._id },
                { $set: { kelas: namaKelas } }
            );
            console.log('Fixed:', j.hari, j.mataPelajaran, kelasId, '->', namaKelas);
        } else {
            console.log('No mapping for:', kelasId);
        }
    }
    
    // Verify
    const after = await db.collection('jadwals').find({}).toArray();
    console.log('\nAfter:');
    after.forEach(j => console.log(j.hari, '|', j.kelas, '|', j.mataPelajaran));
    
    await client.close();
}

migrate().catch(console.error);
