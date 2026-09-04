'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/waliKelasController');
const { protect, protectPengabsen } = require('../middleware/auth');

// ─── Route untuk guru (wali kelas) ───────────────────────────────────────────
router.get   ('/pengabsen',            protect, ctrl.listPengabsen);
router.post  ('/pengabsen',            protect, ctrl.createPengabsen);
router.put   ('/pengabsen/:id',        protect, ctrl.updatePengabsen);
router.delete('/pengabsen/:id',        protect, ctrl.deletePengabsen);

router.get   ('/absensi-harian',       protect, ctrl.listAbsensiHarian);
router.get   ('/rekap',                protect, ctrl.rekapAbsensiHarian);
router.get   ('/download',             protect, ctrl.downloadAbsensiHarian);
router.put   ('/absensi-harian/:id',   protect, ctrl.updateAbsensiHarian);
router.delete('/absensi-harian/:id',   protect, ctrl.deleteAbsensiHarian);

// ─── Route untuk pengabsen kelas ─────────────────────────────────────────────
router.post  ('/pengabsen-login',      ctrl.loginPengabsen);
router.get   ('/info-pengabsen',       protectPengabsen, ctrl.infoPengabsen);
router.get   ('/siswa-kelas',          protectPengabsen, ctrl.siswaPengabsen);
router.get   ('/absensi-hari-ini',     protectPengabsen, ctrl.absensiHariIni);
router.post  ('/input-absensi',        protectPengabsen, ctrl.inputAbsensi);

module.exports = router;
