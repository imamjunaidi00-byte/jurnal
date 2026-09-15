'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/nilaiController');
const upload = require('../middleware/upload');

router.get ('/ranking',   ctrl.ranking);
router.get ('/download',  ctrl.download);
router.get ('/template',  ctrl.downloadTemplate);
router.post('/import',    upload.single('file'), ctrl.importNilai);
router.get ('/',          ctrl.list);
router.post('/',          ctrl.save);
router.post('/bulk',      ctrl.bulkSave);

module.exports = router;
