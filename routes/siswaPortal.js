// Route khusus portal siswa — public, hanya bisa baca data milik NISN sendiri
const express = require('express');
const router = express.Router();
const Siswa = require('../models/Siswa');
const Absensi = require('../models/Absensi');
const Nilai = require('../models/Nilai');
const mongoose = require('mongoose');

// Helper: cari siswa by NISN
const findSiswaByNisn = async (nisn) => {
  if (!nisn) return null;
  return await Siswa.findOne({ nisn });
};

// GET /api/siswa-portal/login?nisn=xxx — autentikasi siswa
router.get('/login', async (req, res) => {
  try {
    const { nisn } = req.query;
    if (!nisn) return res.status(400).json({ success: false, message: 'NISN wajib diisi.' });
    const siswa = await Siswa.findOne({ nisn }).lean();
    if (!siswa) return res.status(404).json({ success: false, message: 'NISN tidak ditemukan.' });
    res.json({ success: true, data: siswa });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/siswa-portal/jadwal?nisn=xxx — jadwal berdasarkan kelas siswa
router.get('/jadwal', async (req, res) => {
  try {
    const { nisn } = req.query;
    const siswa = await findSiswaByNisn(nisn);
    if (!siswa) return res.json({ success: true, count: 0, data: [] });

    const db = mongoose.connection.db;
    const jadwal = await db.collection('jadwals')
      .find({ kelas: siswa.kelas })
      .sort({ hari: 1, jamMulai: 1 })
      .toArray();

    res.json({ success: true, count: jadwal.length, data: jadwal });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/siswa-portal/materi?nisn=xxx — mind map berdasarkan kelas siswa
router.get('/materi', async (req, res) => {
  try {
    const { nisn } = req.query;
    const siswa = await findSiswaByNisn(nisn);
    if (!siswa) return res.json({ success: true, count: 0, data: [] });

    const MindMap = require('../models/MindMap');
    // Filter berdasarkan kelas siswa ATAU kelas kosong (materi umum)
    const materi = await MindMap.find({
      $or: [
        { kelas: siswa.kelas },
        { kelas: '' },
        { kelas: null }
      ]
    }).sort({ updatedAt: -1 }).lean();

    res.json({ success: true, count: materi.length, data: materi });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/siswa-portal/absensi?nisn=xxx — absensi milik siswa
router.get('/absensi', async (req, res) => {
  try {
    const { nisn } = req.query;
    const siswa = await findSiswaByNisn(nisn);
    if (!siswa) return res.json({ success: true, count: 0, data: [] });

    const absensi = await Absensi.find({ siswa: siswa._id })
      .sort({ tanggal: -1 })
      .lean();
    res.json({ success: true, count: absensi.length, data: absensi });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/siswa-portal/nilai?nisn=xxx — nilai yang sudah dipublish
router.get('/nilai', async (req, res) => {
  try {
    const { nisn } = req.query;
    const siswa = await findSiswaByNisn(nisn);
    if (!siswa) return res.json({ success: true, count: 0, data: [] });

    const nilai = await Nilai.find({ siswa: siswa._id, tampilkan: true })
      .populate('siswa', 'nama nisn')
      .lean();
    res.json({ success: true, count: nilai.length, data: nilai });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
