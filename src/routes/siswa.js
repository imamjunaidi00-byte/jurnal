'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/siswaController');
const upload = require('../middleware/upload');

router.get   ('/',              ctrl.list);
router.post  ('/',              ctrl.create);
router.get   ('/kelas-list',    ctrl.kelasList);
router.get   ('/export/excel',  ctrl.exportExcel);
router.get   ('/template',     (req, res) => {
  const { writeExcel } = require('../utils/excel');
  const template = [{
    nisn: '', nis: '', nama: '', kelas: '', jenis_kelamin: 'L/P',
    tempat_lahir: '', tanggal_lahir: 'YYYY-MM-DD', agama: '',
    alamat: '', nama_ayah: '', nama_ibu: '', telp_ortu: '', no_hp: '',
    tahun_masuk: '', penerima_bantuan: 'Tidak', status: 'Aktif',
  }];
  const buf = writeExcel(template, 'Template Siswa');
  res.setHeader('Content-Disposition', 'attachment; filename="template-siswa.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});
router.post  ('/import',        upload.single('file'), ctrl.importSiswa);
router.post  ('/bulk-delete',   ctrl.bulkDelete);
router.get   ('/:id',           ctrl.getById);
router.put   ('/:id',           ctrl.update);
router.delete('/:id',           ctrl.destroy);

module.exports = router;
