'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/mindmapController');

router.get   ('/',    ctrl.list);
router.post  ('/',    ctrl.create);
router.get   ('/:id', ctrl.getById);
router.put   ('/:id', ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
