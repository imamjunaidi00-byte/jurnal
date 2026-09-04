'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/jadwalController');

router.get   ('/',           ctrl.list);
router.post  ('/',           ctrl.create);
router.get   ('/by-guru',    ctrl.byGuru);
router.get   ('/:id',        ctrl.getById);
router.put   ('/:id',        ctrl.update);
router.delete('/:id',        ctrl.destroy);

module.exports = router;
