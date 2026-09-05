'use strict';

const { Siswa, Jadwal, MindMap, Absensi, Nilai, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');

const JWT_SECRET  = () => process.env.JWT_SECRET || 'change_me';
const DEFAULT_PWD = process.env.SISWA_DEFAULT_PASSWORD || 'smkn1kras';

// ─── Helper: generate JWT siswa ──────────────────────────────────────────────
function generateSiswaToken(siswa) {
  return jwt.sign(
    { id: siswa.id, nisn: siswa.nisn, type: 'siswa' },
    JWT_SECRET(),
    { expiresIn: '7d' }
  );
}

// ─── Middleware: verifikasi token siswa ──────────────────────────────────────
async function verifySiswaToken(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET());
    if (decoded.type !== 'siswa') return null;
    return await Siswa.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
  } catch { return null; }
}

// ── POST /api/siswa-portal/login ─────────────────────────────────────────────
// Login dengan NISN + password (default: smkn1kras)
exports.login = async (req, res) => {
  try {
    const { nisn, password } = req.body;
    if (!nisn || !password) return fail(res, 'NISN dan password wajib diisi.', 400);

    const siswa = await Siswa.findOne({ where: { nisn: nisn.trim(), status: 'Aktif' } });
    if (!siswa) return fail(res, 'NISN tidak ditemukan atau akun tidak aktif.', 404);

    // Cek password: jika belum punya password hash → pakai default
    let valid = false;
    if (siswa.password) {
      valid = await bcrypt.compare(password, siswa.password);
    } else {
      // Belum punya password → cocokkan dengan default
      valid = (password === DEFAULT_PWD);
    }

    if (!valid) return fail(res, 'Password salah.', 401);

    const token = generateSiswaToken(siswa);
    const s = siswa.toJSON();
    s.umur = siswa.umur;

    return ok(res, { token, siswa: s }, 'Login berhasil.');
  } catch (err) {
    console.error('siswa login error:', err.message);
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// ── PUT /api/siswa-portal/password ─────────────────────────────────────────
// Ganti password siswa
exports.gantiPassword = async (req, res) => {
  try {
    const siswa = await verifySiswaToken(req, res);
    if (!siswa) return fail(res, 'Sesi tidak valid, silakan login ulang.', 401);

    const { passwordLama, passwordBaru } = req.body;
    if (!passwordLama || !passwordBaru)
      return fail(res, 'Password lama dan baru wajib diisi.', 400);
    if (passwordBaru.length < 6)
      return fail(res, 'Password baru minimal 6 karakter.', 400);

    // Cek password lama
    const s = await Siswa.findByPk(siswa.id);
    let valid = false;
    if (s.password) {
      valid = await bcrypt.compare(passwordLama, s.password);
    } else {
      valid = (passwordLama === DEFAULT_PWD);
    }
    if (!valid) return fail(res, 'Password lama tidak sesuai.', 401);

    const hash = await bcrypt.hash(passwordBaru, 10);
    await s.update({ password: hash });

    return ok(res, null, 'Password berhasil diubah.');
  } catch (err) {
    return fail(res, 'Gagal mengubah password.', 500);
  }
};

// ── PUT /api/siswa-portal/profil ─────────────────────────────────────────────
// Update profil siswa — verifikasi via JWT token
exports.updateProfil = async (req, res) => {
  try {
    const siswaAuth = await verifySiswaToken(req, res);
    if (!siswaAuth) return fail(res, 'Sesi tidak valid, silakan login ulang.', 401);

    const siswa = await Siswa.findByPk(siswaAuth.id);
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    const allowed = ['alamat', 'noHp', 'telpOrtu', 'tempatLahir'];
    const updateData = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updateData[k] = req.body[k];
    }
    await siswa.update(updateData);
    const s = siswa.toJSON();
    s.umur = siswa.umur;
    return ok(res, s, 'Profil berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui profil.', 500);
  }
};

// ── GET /api/siswa-portal/me ──────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const siswa = await verifySiswaToken(req, res);
    if (!siswa) return fail(res, 'Sesi tidak valid.', 401);
    const s = siswa.toJSON();
    s.umur = siswa.umur;
    return ok(res, s);
  } catch (err) {
    return fail(res, 'Terjadi kesalahan.', 500);
  }
};

// ─── Helper: ambil siswa dari token atau dari query nisn+tanggalLahir (backward compat)
async function getSiswa(req) {
  // Coba dari JWT token dulu
  const siswa = await verifySiswaToken(req, null);
  if (siswa) return siswa;
  // Fallback: dari query params (backward compat)
  const { nisn, tanggalLahir } = req.query;
  if (nisn && tanggalLahir) {
    return Siswa.findOne({ where: { nisn, tanggalLahir }, attributes: { exclude: ['password'] } });
  }
  return null;
}

// ── GET /api/siswa-portal/jadwal ─────────────────────────────────────────────
exports.jadwal = async (req, res) => {
  try {
    const siswa = await getSiswa(req);
    if (!siswa) return fail(res, 'Sesi tidak valid, silakan login ulang.', 401);

    const jadwal = await Jadwal.findAll({
      where: { kelas: siswa.kelas, aktif: true },
      order: [['hari','ASC'],['jamMulai','ASC']],
      attributes: { exclude: ['guruId'] },
    });
    return ok(res, jadwal);
  } catch (err) {
    return fail(res, 'Gagal mengambil jadwal.', 500);
  }
};

// ── GET /api/siswa-portal/materi ─────────────────────────────────────────────
exports.materi = async (req, res) => {
  try {
    const siswa = await getSiswa(req);
    if (!siswa) return fail(res, 'Sesi tidak valid, silakan login ulang.', 401);

    const materi = await MindMap.findAll({
      where: { kelas: siswa.kelas },
      attributes: { exclude: ['nodes','guruId'] },
      order: [['updatedAt','DESC']],
    });
    return ok(res, materi);
  } catch (err) {
    return fail(res, 'Gagal mengambil materi.', 500);
  }
};

// ── GET /api/siswa-portal/mindmap/:id ────────────────────────────────────────
exports.getMindmap = async (req, res) => {
  try {
    const mm = await MindMap.findByPk(req.params.id, { attributes: { exclude: ['guruId'] } });
    if (!mm) return fail(res, 'Mind map tidak ditemukan.', 404);
    return ok(res, mm);
  } catch (err) {
    return fail(res, 'Gagal mengambil mind map.', 500);
  }
};

// ── GET /api/siswa-portal/absensi ─────────────────────────────────────────────
exports.absensi = async (req, res) => {
  try {
    const siswa = await getSiswa(req);
    if (!siswa) return fail(res, 'Sesi tidak valid.', 401);

    const where = { siswaId: siswa.id };
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;

    const list = await Absensi.findAll({ where, order: [['tanggal','DESC']] });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil absensi.', 500);
  }
};

// ── GET /api/siswa-portal/nilai ───────────────────────────────────────────────
exports.nilai = async (req, res) => {
  try {
    const siswa = await getSiswa(req);
    if (!siswa) return fail(res, 'Sesi tidak valid.', 401);

    const where = { siswaId: siswa.id, tampilkan: true };
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;

    const list = await Nilai.findAll({
      where,
      attributes: { exclude: ['guruId','tampilkan'] },
      order: [['mataPelajaran','ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil nilai.', 500);
  }
};
