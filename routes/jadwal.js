const express = require('express');
const router = express.Router();
const {
  getAllJadwal,
  getJadwalById,
  createJadwal,
  updateJadwal,
  deleteJadwal,
  getJadwalByHari,
  getJadwalByGuru,
  getJadwalByKelas
} = require('../controllers/jadwalController');

// Routes khusus — harus SEBELUM /:id
router.get('/hari/:hari', getJadwalByHari);
router.get('/guru/:guru', getJadwalByGuru);
router.get('/kelas/:kelasId', getJadwalByKelas);

// Routes utama
router.get('/', getAllJadwal);
router.post('/', createJadwal);
router.get('/:id', getJadwalById);
router.put('/:id', updateJadwal);
router.delete('/:id', deleteJadwal);

module.exports = router;