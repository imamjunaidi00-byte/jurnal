'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/absensiController');

router.get ('/',                    ctrl.list);
router.post('/bulk',                ctrl.bulkSave);
router.get ('/rekap',               ctrl.rekap);
router.get ('/rekap-gabungan',      ctrl.rekapGabungan);
router.get ('/rekap/download',      ctrl.downloadRekap);
router.get ('/summary',             ctrl.summary);
router.put ('/:id',                 ctrl.update);
router.delete('/:id',               ctrl.destroy);

module.exports = router;
