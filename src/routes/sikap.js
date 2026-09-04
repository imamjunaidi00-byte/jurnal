'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/sikapController');

router.get   ('/',       ctrl.list);
router.post  ('/',       ctrl.save);
router.post  ('/bulk',   ctrl.bulkSave);
router.delete('/bulk',   ctrl.bulkDelete);

module.exports = router;
