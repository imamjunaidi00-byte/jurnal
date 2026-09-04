'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/profilController');

router.get('/', ctrl.get);
router.put('/', ctrl.update);

module.exports = router;
