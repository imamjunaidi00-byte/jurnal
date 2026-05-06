const express = require('express');
const router = express.Router();
const {
  getSikap,
  createOrUpdateSikap,
  bulkUpdateSikap
} = require('../controllers/sikapController');

router.get('/', getSikap);
router.post('/', createOrUpdateSikap);
router.post('/bulk', bulkUpdateSikap);

// DELETE /api/sikap/bulk?kelas=X TKR 1&semester=Genap&tahunAjaran=2025/2026
router.delete('/bulk', async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    if (!kelas) return res.status(400).json({ success: false, message: 'kelas wajib diisi.' });
    const Sikap = require('../models/Sikap');
    const filter = { kelas };
    if (semester) filter.semester = semester;
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    const result = await Sikap.deleteMany(filter);
    res.json({ success: true, deleted: result.deletedCount, message: `${result.deletedCount} data sikap dihapus.` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;