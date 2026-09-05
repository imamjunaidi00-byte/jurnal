'use strict';

const { Guru, LoginLog } = require('../models/index');
const { generateToken, invalidateToken, invalidateGuruTokens } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { Op } = require('sequelize');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return fail(res, 'Username dan password wajib diisi.', 400);

    const guru = await Guru.findOne({ where: { username: username.toLowerCase().trim() } });
    if (!guru) return fail(res, 'Username atau password salah.', 401);

    const match = await guru.matchPassword(password);
    if (!match) return fail(res, 'Username atau password salah.', 401);

    // Catat login log
    await LoginLog.create({
      guruId:    guru.id,
      username:  guru.username,
      nama:      guru.nama,
      ip:        req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    }).catch(() => {});  // tidak crash jika log gagal

    const token = generateToken({ id: guru.id, role: guru.role });
    const guruData = guru.toJSON(); // password sudah di-strip

    // Format response: { success, token, data } agar kompatibel dengan frontend
    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      data: guruData,
    });
  } catch (err) {
    console.error('login error:', err);
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    // Hanya boleh jika belum ada admin
    const adminExists = await Guru.findOne({ where: { role: 'admin' } });
    if (adminExists)
      return fail(res, 'Registrasi ditutup. Hubungi administrator.', 403);

    const { username, password, nama } = req.body;
    if (!username || !password || !nama)
      return fail(res, 'Username, password, dan nama wajib diisi.', 400);
    if (password.length < 6)
      return fail(res, 'Password minimal 6 karakter.', 400);

    const exists = await Guru.findOne({ where: { username: username.toLowerCase().trim() } });
    if (exists) return fail(res, 'Username sudah digunakan.', 409);

    const guru = await Guru.create({ username, password, nama, role: 'admin' });
    const token = generateToken({ id: guru.id, role: guru.role });

    return res.json({
      success: true,
      message: 'Registrasi berhasil.',
      token,
      data: guru.toJSON(),
    });
  } catch (err) {
    console.error('register error:', err);
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return ok(res, req.guru);
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  if (req.token) invalidateToken(req.token);
  return ok(res, null, 'Logout berhasil.');
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { passwordLama, passwordBaru } = req.body;
    if (!passwordLama || !passwordBaru)
      return fail(res, 'Password lama dan baru wajib diisi.', 400);
    if (passwordBaru.length < 6)
      return fail(res, 'Password baru minimal 6 karakter.', 400);

    const guru = await Guru.findByPk(req.guru.id);
    if (!await guru.matchPassword(passwordLama))
      return fail(res, 'Password lama tidak sesuai.', 401);

    guru.password = passwordBaru;
    await guru.save();
    if (req.token) invalidateToken(req.token);

    return ok(res, null, 'Password berhasil diubah. Silakan login ulang.');
  } catch (err) {
    console.error('changePassword error:', err);
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// PUT /api/auth/username
exports.changeUsername = async (req, res) => {
  try {
    // Terima 'username' atau 'usernameBaru' (dari frontend lama)
    const username = req.body.username || req.body.usernameBaru;
    if (!username) return fail(res, 'Username baru wajib diisi.', 400);

    const uname = username.toLowerCase().trim();
    const exists = await Guru.findOne({ where: { username: uname, id: { [Op.ne]: req.guru.id } } });
    if (exists) return fail(res, 'Username sudah digunakan.', 409);

    await Guru.update({ username: uname }, { where: { id: req.guru.id } });
    invalidateGuruTokens(req.guru.id);

    return ok(res, null, 'Username berhasil diubah. Silakan login ulang.');
  } catch (err) {
    console.error('changeUsername error:', err);
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// GET /api/auth/check-setup
exports.checkSetup = async (req, res) => {
  const adminExists = await Guru.findOne({ where: { role: 'admin' } });
  return ok(res, { setupRequired: !adminExists });
};

// GET /api/auth/accounts — info akun sendiri (untuk tab Keamanan)
exports.getAccounts = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.guru.id, {
      attributes: { exclude: ['password'] },
    });
    if (!guru) return fail(res, 'Akun tidak ditemukan.', 404);
    // Kembalikan sebagai array untuk kompatibilitas dengan frontend
    return ok(res, [guru.toJSON()]);
  } catch (err) {
    return fail(res, 'Gagal mengambil info akun.', 500);
  }
};

// DELETE /api/auth/accounts/:id — hapus akun sendiri
exports.deleteAccount = async (req, res) => {
  try {
    // Hanya boleh hapus akun diri sendiri
    if (String(req.params.id) !== String(req.guru.id)) {
      return fail(res, 'Tidak bisa menghapus akun orang lain.', 403);
    }
    const guru = await Guru.findByPk(req.guru.id);
    if (!guru) return fail(res, 'Akun tidak ditemukan.', 404);

    const { invalidateToken } = require('../middleware/auth');
    if (req.token) invalidateToken(req.token);
    await guru.destroy();

    return ok(res, null, 'Akun berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus akun.', 500);
  }
};

// ─── GET /api/auth/sso?token=<sso_token> ─────────────────────────────────────
// Dipanggil dari browser setelah redirect dari SDMS App Hub.
// Verifikasi JWT SSO → cari/buat akun guru → return token jurnal.
// Frontend (sso.html) akan simpan token ke localStorage lalu redirect ke /app.
exports.ssoCallback = async (req, res) => {
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');

  const SSO_SECRET = process.env.SSO_SECRET || 'sso_secret_jurnal_smkn1kras_2026';
  const SSO_APP    = process.env.SSO_APP_NAME || 'jurnal';

  const { token } = req.query;

  if (!token) {
    return res.redirect('/login?error=sso_no_token');
  }

  try {
    // 1. Verifikasi JWT dari SDMS
    const decoded = jwt.verify(token, SSO_SECRET, {
      audience: SSO_APP,
      issuer:   'sdms-core',
    });

    // 2. Petakan role SDMS → role jurnal
    const roleMap = {
      super_admin:    'admin',
      admin:          'admin',
      kepala_sekolah: 'admin',
      guru:           'guru',
      wali_kelas:     'guru',
      pegawai:        'guru',
      operator:       'guru',
      petugas_piket:  'guru',
    };
    const localRole = roleMap[decoded.role] || 'guru';

    // 3. Cari guru berdasarkan username dari SDMS
    let guru = await Guru.findOne({ where: { username: decoded.username } });

    if (!guru) {
      // Belum ada → buat akun otomatis (password random, tidak bisa login manual)
      const dummyPass = crypto.randomBytes(16).toString('hex');
      guru = await Guru.create({
        username: decoded.username,
        password: dummyPass,
        nama:     decoded.full_name || decoded.username,
        role:     localRole,
        nip:      decoded.username,  // asumsi username = NIP
      });
      console.log(`[SSO] ✅ Akun guru baru dibuat: ${decoded.username} (${localRole})`);
    } else {
      // Sudah ada → update nama & role jika berubah di SDMS
      const updates = {};
      if (decoded.full_name && decoded.full_name !== guru.nama) updates.nama = decoded.full_name;
      if (localRole !== guru.role) updates.role = localRole;
      if (Object.keys(updates).length) await guru.update(updates);
    }

    // 4. Catat login log
    await LoginLog.create({
      guruId:    guru.id,
      username:  guru.username,
      nama:      guru.nama,
      ip:        req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    }).catch(() => {});

    // 5. Buat token jurnal lokal
    const localToken = generateToken({ id: guru.id, role: guru.role });
    const guruData   = guru.toJSON();

    // 6. Redirect ke halaman SSO landing — token dikirim via URL fragment (#)
    //    agar tidak muncul di server log / access log.
    return res.redirect(`/sso.html#token=${localToken}&role=${guru.role}`);

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('[SSO] Token kadaluarsa');
      return res.redirect('/login?error=sso_expired');
    }
    if (err.name === 'JsonWebTokenError') {
      console.warn('[SSO] Token tidak valid:', err.message);
      return res.redirect('/login?error=sso_invalid');
    }
    console.error('[SSO] Error:', err.message);
    return res.redirect('/login?error=sso_error');
  }
};
