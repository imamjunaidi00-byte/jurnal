'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/kelasController');

// protect sudah di-mount di server.js
router.get   ('/',          ctrl.list);
router.get   ('/:id',       ctrl.getById);
router.post  ('/',          ctrl.create);
router.put   ('/:id',       ctrl.update);
router.delete('/:id',       ctrl.destroy);
router.post  ('/bulk-delete', ctrl.bulkDelete);

module.exports = router;
