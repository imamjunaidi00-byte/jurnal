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

    return ok(res, { token, guru: guruData }, 'Login berhasil.');
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

    return ok(res, { token, guru: guru.toJSON() }, 'Registrasi berhasil.', 201);
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
    const { username } = req.body;
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
