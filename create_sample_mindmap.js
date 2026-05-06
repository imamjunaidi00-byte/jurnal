const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurnal_guru';

async function createSample() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Buat sample mind map
    const sampleMindMap = {
      judul: "Dasar-Dasar Pemrograman",
      mataPelajaran: "Informatika",
      kelas: "X TKRO 1",
      deskripsi: "Mind map materi dasar pemrograman untuk kelas X",
      guru: "IMAM JUNAIDI ABROR",
      warna: "#8b5cf6",
      nodes: {
        id: "n1",
        text: "Pemrograman Dasar",
        color: "#8b5cf6",
        children: [
          {
            id: "n2",
            text: "Algoritma",
            color: "#3b82f6",
            children: [
              { id: "n3", text: "Flowchart", color: "#10b981", children: [], materials: [] },
              { id: "n4", text: "Pseudocode", color: "#10b981", children: [], materials: [] }
            ],
            materials: []
          },
          {
            id: "n5",
            text: "Struktur Data",
            color: "#f59e0b",
            children: [
              { id: "n6", text: "Array", color: "#ec4899", children: [], materials: [] },
              { id: "n7", text: "Linked List", color: "#ec4899", children: [], materials: [] }
            ],
            materials: []
          },
          {
            id: "n8",
            text: "Bahasa Pemrograman",
            color: "#06b6d4",
            children: [
              { id: "n9", text: "Python", color: "#84cc16", children: [], materials: [] },
              { id: "n10", text: "JavaScript", color: "#84cc16", children: [], materials: [] }
            ],
            materials: []
          }
        ],
        materials: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('mindmaps').insertOne(sampleMindMap);
    console.log('✅ Sample mind map created:', result.insertedId);
    
    // Buat satu lagi
    const sampleMindMap2 = {
      judul: "Jaringan Komputer",
      mataPelajaran: "Informatika",
      kelas: "X TKRO 2",
      deskripsi: "Mind map materi jaringan komputer",
      guru: "IMAM JUNAIDI ABROR",
      warna: "#3b82f6",
      nodes: {
        id: "n1",
        text: "Jaringan Komputer",
        color: "#3b82f6",
        children: [
          {
            id: "n2",
            text: "Topologi",
            color: "#8b5cf6",
            children: [
              { id: "n3", text: "Star", color: "#10b981", children: [], materials: [] },
              { id: "n4", text: "Ring", color: "#10b981", children: [], materials: [] },
              { id: "n5", text: "Bus", color: "#10b981", children: [], materials: [] }
            ],
            materials: []
          },
          {
            id: "n6",
            text: "Protokol",
            color: "#f59e0b",
            children: [
              { id: "n7", text: "TCP/IP", color: "#ec4899", children: [], materials: [] },
              { id: "n8", text: "HTTP", color: "#ec4899", children: [], materials: [] }
            ],
            materials: []
          }
        ],
        materials: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result2 = await db.collection('mindmaps').insertOne(sampleMindMap2);
    console.log('✅ Sample mind map 2 created:', result2.insertedId);
    
    await mongoose.connection.close();
    console.log('\n✅ Selesai membuat sample mind map');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

createSample();
