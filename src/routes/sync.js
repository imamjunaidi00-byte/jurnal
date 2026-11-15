'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/syncController');
const { adminOnly } = require('../middleware/auth');

// ── Webhook: no adminOnly — authenticated via X-Sync-Secret header ──────────
router.post('/webhook', ctrl.receiveWebhook);

// Semua endpoint sync lainnya hanya untuk admin
router.use(adminOnly);

// Status & info
router.get ('/status',      ctrl.getStatus);
router.get ('/test',        ctrl.testConn);
router.get ('/preview',     ctrl.preview);

// Sync penuh — async (langsung balik, polling status)
router.post('/full',        ctrl.syncFull);

// Sync penuh — sync/await (tunggu sampai selesai, cocok untuk data < 1000)
router.post('/full/await',  ctrl.syncFullAwait);

// Sync sebagian: POST /api/sync/kelas | /api/sync/siswa | /api/sync/guru | /api/sync/walikelas
router.post('/:type',       ctrl.syncPartial);

module.exports = router;
