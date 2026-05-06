const express = require('express');
const router = express.Router();
const {
  getNilai,
  createOrUpdateNilai,
  bulkUpdateNilai,
  downloadNilai,
  getRanking
} = require('../controllers/nilaiController');

router.get('/', getNilai);
router.post('/', createOrUpdateNilai);
router.post('/bulk', bulkUpdateNilai);
router.get('/download', downloadNilai);
router.get('/ranking', getRanking);

module.exports = router;