const express = require('express');
const router = express.Router();
const Jurnal = require('../models/Jurnal');

// GET semua jurnal (dengan filter)
router.get('/', async (req, res) => {
  try {
    const { semester, tahunAjaran, kelas, bulan } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (kelas) filter.kelas = kelas;
    if (bulan) {
      const [year, month] = bulan.split('-');
      filter.tanggal = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      };
    }
    const data = await Jurnal.find(filter).sort({ tanggal: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET satu jurnal
router.get('/:id', async (req, res) => {
  try {
    const data = await Jurnal.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST buat jurnal baru
router.post('/', async (req, res) => {
  try {
    const data = await Jurnal.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT update jurnal
router.put('/:id', async (req, res) => {
  try {
    const data = await Jurnal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE jurnal
router.delete('/:id', async (req, res) => {
  try {
    const data = await Jurnal.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan' });
    res.json({ success: true, message: 'Jurnal berhasil dihapus' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
