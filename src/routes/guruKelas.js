'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/guruKelasController');

router.get   ('/',              ctrl.list);
router.get   ('/kelas-list',    ctrl.kelasList);
router.get   ('/mapel-by-kelas',ctrl.mapelByKelas);
router.post  ('/',              ctrl.create);
router.put   ('/:id',           ctrl.update);
router.delete('/:id',           ctrl.destroy);

module.exports = router;
