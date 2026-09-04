'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Semua route di sini wajib admin
router.use(adminOnly);

router.get   ('/guru',                    ctrl.listGuru);
router.post  ('/guru',                    ctrl.createGuru);
router.put   ('/guru/:id/edit',           ctrl.editGuru);
router.put   ('/guru/:id/reset-password', ctrl.resetPassword);
router.delete('/guru/:id',                ctrl.deleteGuru);
router.post  ('/guru/bulk-delete',        ctrl.bulkDeleteGuru);
router.put   ('/guru/:id/wali-kelas',     ctrl.setWaliKelas);
router.get   ('/guru/wali-kelas',         ctrl.listWaliKelas);
router.post  ('/guru/import-excel',       upload.single('file'), ctrl.importGuruExcel);
router.get   ('/guru/export-excel',       ctrl.exportGuruExcel);

router.get   ('/app-identity', ctrl.getAppIdentity);
router.put   ('/app-identity', ctrl.updateAppIdentity);

router.get   ('/aktivitas',             ctrl.getAktivitas);
router.get   ('/aktivitas/stats',       ctrl.getAktivitasStats);

module.exports = router;
