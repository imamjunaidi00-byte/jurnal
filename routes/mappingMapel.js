const express = require('express');
const router = express.Router();
const MappingMapel = require('../models/MappingMapel');

// GET semua
router.get('/', async (req, res) => {
  try {
    const data = await MappingMapel.find().sort({ nama: 1 });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST tambah
router.post('/', async (req, res) => {
  try {
    const { nama, kode, deskripsi } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    const exists = await MappingMapel.findOne({ nama: new RegExp(`^${nama}$`, 'i') });
    if (exists) return res.status(400).json({ success: false, message: 'Mata pelajaran sudah ada' });
    const data = await MappingMapel.create({ nama, kode, deskripsi });
    res.status(201).json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT edit
router.put('/:id', async (req, res) => {
  try {
    const { nama, kode, deskripsi } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    const data = await MappingMapel.findByIdAndUpdate(
      req.params.id,
      { nama, kode, deskripsi },
      { new: true }
    );
    if (!data) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const data = await MappingMapel.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
