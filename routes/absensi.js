const express = require('express');
const router = express.Router();
const {
  getAbsensi,
  createBulkAbsensi,
  getRekap,
  downloadRekap,
  updateAbsensi
} = require('../controllers/absensiController');

router.get('/', getAbsensi);
router.post('/bulk', createBulkAbsensi);
router.get('/rekap', getRekap);
router.get('/rekap/download', downloadRekap);
router.put('/:id', updateAbsensi);

// GET /api/absensi/summary?kelas=X TKRO 1&tanggal=2026-04-20
// Rekap cepat untuk jurnal: hadir, sakit, izin, alpha, total siswa
router.get('/summary', async (req, res) => {
  try {
    const { kelas, tanggal } = req.query;
    if (!kelas || !tanggal) return res.status(400).json({ success: false, message: 'kelas dan tanggal wajib diisi' });

    const Absensi = require('../models/Absensi');
    const Siswa   = require('../models/Siswa');

    // Hitung total siswa di kelas
    const totalSiswa = await Siswa.countDocuments({ kelas: kelas.trim() });

    // Ambil absensi pada tanggal tersebut untuk kelas ini
    const start = new Date(tanggal); start.setHours(0,0,0,0);
    const end   = new Date(tanggal); end.setHours(23,59,59,999);

    const absensi = await Absensi.find({
      kelas: kelas.trim(),
      tanggal: { $gte: start, $lte: end }
    }).lean();

    const hadir = absensi.filter(a => a.status === 'hadir').length;
    const sakit = absensi.filter(a => a.status === 'sakit').length;
    const izin  = absensi.filter(a => a.status === 'izin').length;
    const alpha = absensi.filter(a => a.status === 'alpha').length;
    const totalAbsen = absensi.length;

    res.json({
      success: true,
      data: { totalSiswa, totalAbsen, hadir, sakit, izin, alpha, adaData: totalAbsen > 0 }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;