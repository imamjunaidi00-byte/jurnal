'use strict';

const { Jadwal } = require('../models/index');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.hari)        where.hari        = req.query.hari;
    if (req.query.kelas)       where.kelas       = req.query.kelas;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.aktif !== undefined) where.aktif = req.query.aktif === 'true';

    const list = await Jadwal.findAll({ where, order: [['hari','ASC'],['jamMulai','ASC']] });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil jadwal.', 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const j = await Jadwal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!j) return fail(res, 'Jadwal tidak ditemukan.', 404);
    return ok(res, j);
  } catch (err) {
    return fail(res, 'Gagal mengambil jadwal.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const j = await Jadwal.create({
      ...req.body, guruId: req.guru.id, guru: req.body.guru || req.guru.nama,
    });
    return ok(res, j, 'Jadwal berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat jadwal.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const j = await Jadwal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!j) return fail(res, 'Jadwal tidak ditemukan.', 404);
    await j.update(req.body);
    return ok(res, j, 'Jadwal berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui jadwal.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const j = await Jadwal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!j) return fail(res, 'Jadwal tidak ditemukan.', 404);
    await j.destroy();
    return ok(res, null, 'Jadwal berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus jadwal.', 500);
  }
};

exports.byGuru = async (req, res) => {
  try {
    const list = await Jadwal.findAll({
      where: { guruId: req.guru.id, aktif: true },
      order: [['hari','ASC'],['jamMulai','ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil jadwal guru.', 500);
  }
};
