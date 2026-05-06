const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  getAllSiswa,
  getSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
  importCSV,
  exportExcel,
  exportCSV
} = require('../controllers/siswaController');

router.post('/import', upload.single('file'), importCSV);
router.get('/export/excel', exportExcel);
router.get('/export/csv', exportCSV);

// Bulk delete — harus sebelum /:id
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || !ids.length)
      return res.status(400).json({ success: false, message: 'IDs wajib diisi.' });
    const mongoose = require('mongoose');
    const Siswa = require('../models/Siswa');
    const result = await Siswa.deleteMany({ _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } });
    res.json({ success: true, deleted: result.deletedCount, message: `${result.deletedCount} siswa berhasil dihapus.` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.route('/')
  .get(getAllSiswa)
  .post(createSiswa);

router.route('/:id')
  .get(getSiswa)
  .put(updateSiswa)
  .delete(deleteSiswa);

module.exports = router;