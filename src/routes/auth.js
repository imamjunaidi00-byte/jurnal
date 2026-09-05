'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post  ('/login',        ctrl.login);
router.post  ('/register',     ctrl.register);
router.get   ('/me',           protect, ctrl.getMe);
router.post  ('/logout',       protect, ctrl.logout);
router.put   ('/password',     protect, ctrl.changePassword);
router.put   ('/username',     protect, ctrl.changeUsername);
router.get   ('/check-setup',  ctrl.checkSetup);
// Info akun sendiri (dipakai di tab Keamanan)
router.get   ('/accounts',     protect, ctrl.getAccounts);
// Hapus akun sendiri
router.delete('/accounts/:id', protect, ctrl.deleteAccount);

// SSO Callback dari SDMS — GET /api/auth/sso?token=xxx
router.get   ('/sso',          ctrl.ssoCallback);

module.exports = router;
