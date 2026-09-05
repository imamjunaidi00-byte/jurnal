'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/siswaPortalController');

// Auth
router.post('/login',        ctrl.login);       // POST dengan NISN + password
router.get ('/me',           ctrl.getMe);       // Cek sesi dari token

// Profil & password
router.put ('/profil',       ctrl.updateProfil);
router.put ('/password',     ctrl.gantiPassword);

// Data siswa (semua pakai JWT token atau backward compat nisn+tanggalLahir)
router.get ('/jadwal',       ctrl.jadwal);
router.get ('/materi',       ctrl.materi);
router.get ('/mindmap/:id',  ctrl.getMindmap);
router.get ('/absensi',      ctrl.absensi);
router.get ('/nilai',        ctrl.nilai);

module.exports = router;
