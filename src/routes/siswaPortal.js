'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/siswaPortalController');

router.get ('/login',        ctrl.login);
router.put ('/profil',       ctrl.updateProfil);
router.get ('/jadwal',       ctrl.jadwal);
router.get ('/materi',       ctrl.materi);
router.get ('/mindmap/:id',  ctrl.getMindmap);
router.get ('/absensi',      ctrl.absensi);
router.get ('/nilai',        ctrl.nilai);

module.exports = router;
