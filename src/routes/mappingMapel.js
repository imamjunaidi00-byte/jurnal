'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/mappingMapelController');

router.get   ('/',    ctrl.list);
router.post  ('/',    ctrl.create);
router.put   ('/:id', ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
