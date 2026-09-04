'use strict';

const { Siswa, Jadwal, MindMap, Absensi, Nilai, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { Op } = require('sequelize');

// GET /api/siswa-portal/login — auth via NISN + tanggalLahir
exports.login = async (req, res) => {
  try {
    const { nisn, tanggalLahir } = req.query;
    if (!nisn || !tanggalLahir) return fail(res, 'NISN dan tanggal lahir wajib diisi.', 400);

    const siswa = await Siswa.findOne({ where: { nisn: nisn.trim(), tanggalLahir, status: 'Aktif' } });
    if (!siswa) return fail(res, 'Data siswa tidak ditemukan atau tidak aktif.', 404);

    const s = siswa.toJSON();
    s.umur = siswa.umur;
    return ok(res, s, 'Data siswa ditemukan.');
  } catch (err) {
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

// PUT /api/siswa-portal/profil
exports.updateProfil = async (req, res) => {
  try {
    const { nisn, tanggalLahir } = req.body;
    const siswa = await Siswa.findOne({ where: { nisn, tanggalLahir } });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    const allowed = ['alamat','noHp','telpOrtu'];
    const updateData = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updateData[k] = req.body[k];
    }
    await siswa.update(updateData);
    return ok(res, siswa, 'Profil berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui profil.', 500);
  }
};

// GET /api/siswa-portal/jadwal
exports.jadwal = async (req, res) => {
  try {
    const { nisn, tanggalLahir } = req.query;
    const siswa = await Siswa.findOne({ where: { nisn, tanggalLahir }, attributes: ['kelas'] });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

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

// GET /api/siswa-portal/materi
exports.materi = async (req, res) => {
  try {
    const { nisn, tanggalLahir } = req.query;
    const siswa = await Siswa.findOne({ where: { nisn, tanggalLahir }, attributes: ['kelas'] });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

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

// GET /api/siswa-portal/mindmap/:id
exports.getMindmap = async (req, res) => {
  try {
    const mm = await MindMap.findByPk(req.params.id, { attributes: { exclude: ['guruId'] } });
    if (!mm) return fail(res, 'Mind map tidak ditemukan.', 404);
    return ok(res, mm);
  } catch (err) {
    return fail(res, 'Gagal mengambil mind map.', 500);
  }
};

// GET /api/siswa-portal/absensi
exports.absensi = async (req, res) => {
  try {
    const { nisn, tanggalLahir, semester, tahunAjaran } = req.query;
    const siswa = await Siswa.findOne({ where: { nisn, tanggalLahir }, attributes: ['id'] });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    const where = { siswaId: siswa.id };
    if (semester)    where.semester    = semester;
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;

    const list = await Absensi.findAll({ where, order: [['tanggal','DESC']] });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil absensi.', 500);
  }
};

// GET /api/siswa-portal/nilai
exports.nilai = async (req, res) => {
  try {
    const { nisn, tanggalLahir, semester, tahunAjaran } = req.query;
    const siswa = await Siswa.findOne({ where: { nisn, tanggalLahir }, attributes: ['id'] });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    const where = { siswaId: siswa.id, tampilkan: true };
    if (semester)    where.semester    = semester;
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;

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
