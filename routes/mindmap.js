const express = require('express');
const router = express.Router();
const MindMap = require('../models/MindMap');

// GET semua mind map
router.get('/', async (req, res) => {
  try {
    const { mataPelajaran, kelas } = req.query;
    const filter = {};
    if (mataPelajaran) filter.mataPelajaran = mataPelajaran;
    if (kelas) filter.kelas = kelas;
    const data = await MindMap.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET satu mind map
router.get('/:id', async (req, res) => {
  try {
    const data = await MindMap.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Mind map tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST buat baru
router.post('/', async (req, res) => {
  try {
    const { judul, mataPelajaran, kelas, deskripsi, guru, nodes, warna } = req.body;
    if (!judul) return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
    const data = await MindMap.create({ judul, mataPelajaran, kelas, deskripsi, guru, nodes: nodes || {}, warna });
    res.status(201).json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const data = await MindMap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ success: false, message: 'Mind map tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const data = await MindMap.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Mind map tidak ditemukan' });
    res.json({ success: true, message: 'Mind map berhasil dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
