const express = require('express');
const router = express.Router();
const { getAllKelas, createKelas } = require('../controllers/kelasController');

router.get('/', getAllKelas);
router.post('/', createKelas);

// POST /api/kelas/rename — rename kelas di semua koleksi
router.post('/rename', async (req, res) => {
  try {
    const { namaLama, namaBaru } = req.body;
    if (!namaLama || !namaBaru)
      return res.status(400).json({ success: false, message: 'namaLama dan namaBaru wajib diisi.' });

    const Siswa   = require('../models/Siswa');
    const Absensi = require('../models/Absensi');
    const Nilai   = require('../models/Nilai');
    const Sikap   = require('../models/Sikap');
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Update semua koleksi secara paralel
    const [rSiswa, rAbsensi, rNilai, rSikap, rJadwal] = await Promise.all([
      Siswa.updateMany({ kelas: namaLama }, { $set: { kelas: namaBaru } }),
      Absensi.updateMany({ kelas: namaLama }, { $set: { kelas: namaBaru } }),
      Nilai.updateMany({ kelas: namaLama }, { $set: { kelas: namaBaru } }),
      Sikap.updateMany({ kelas: namaLama }, { $set: { kelas: namaBaru } }),
      db.collection('jadwals').updateMany({ kelas: namaLama }, { $set: { kelas: namaBaru } })
    ]);

    const total = rSiswa.modifiedCount + rAbsensi.modifiedCount +
                  rNilai.modifiedCount + rSikap.modifiedCount + (rJadwal.modifiedCount || 0);

    res.json({
      success: true,
      updated: total,
      detail: {
        siswa: rSiswa.modifiedCount,
        absensi: rAbsensi.modifiedCount,
        nilai: rNilai.modifiedCount,
        sikap: rSikap.modifiedCount,
        jadwal: rJadwal.modifiedCount || 0
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;