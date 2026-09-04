'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/nilaiController');

router.get ('/ranking',  ctrl.ranking);
router.get ('/download', ctrl.download);
router.get ('/',         ctrl.list);
router.post('/',         ctrl.save);
router.post('/bulk',     ctrl.bulkSave);

module.exports = router;
