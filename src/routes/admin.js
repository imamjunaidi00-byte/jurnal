'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Semua route di sini wajib admin
router.use(adminOnly);

// ── Statistik dashboard ────────────────────────────────────────────────────
router.get('/stats', ctrl.getStats);

// ── Manajemen Guru ─────────────────────────────────────────────────────────
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

// ── Manajemen Admin ────────────────────────────────────────────────────────
router.get   ('/admins',                       ctrl.listAdmins);
router.post  ('/admins',                       ctrl.createAdmin);
router.put   ('/admins/:id/reset-password',    ctrl.resetAdminPassword);
router.delete('/admins/:id',                   ctrl.deleteAdmin);

// ── Identitas Aplikasi ─────────────────────────────────────────────────────
router.get('/app-identity', ctrl.getAppIdentity);
router.put('/app-identity', ctrl.updateAppIdentity);

// ── Aktivitas Login ────────────────────────────────────────────────────────
router.get('/aktivitas',        ctrl.getAktivitas);
router.get('/aktivitas/stats',  ctrl.getAktivitasStats);

module.exports = router;
