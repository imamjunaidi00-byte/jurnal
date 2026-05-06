const { MongoClient } = require('mongodb');

async function reset() {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('jurnal_guru');
    
    // Hapus semua jadwal
    const result = await db.collection('jadwals').deleteMany({});
    console.log('Deleted jadwal:', result.deletedCount);
    
    await client.close();
    console.log('Done - silakan input ulang jadwal dari halaman Jadwal Mengajar');
}

reset().catch(console.error);
