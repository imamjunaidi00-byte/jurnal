'use strict';

const { MindMap } = require('../models/index');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.mataPelajaran) where.mataPelajaran = req.query.mataPelajaran;
    if (req.query.kelas)         where.kelas         = req.query.kelas;

    const list = await MindMap.findAll({
      where,
      attributes: { exclude: ['nodes'] }, // jangan kirim nodes di list
      order: [['updatedAt','DESC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil mind map.', 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const mm = await MindMap.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!mm) return fail(res, 'Mind map tidak ditemukan.', 404);
    return ok(res, mm);
  } catch (err) {
    return fail(res, 'Gagal mengambil mind map.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const mm = await MindMap.create({
      ...req.body, guruId: req.guru.id, guru: req.body.guru || req.guru.nama,
    });
    return ok(res, mm, 'Mind map berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat mind map.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const mm = await MindMap.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!mm) return fail(res, 'Mind map tidak ditemukan.', 404);
    await mm.update(req.body);
    return ok(res, mm, 'Mind map berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui mind map.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const mm = await MindMap.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!mm) return fail(res, 'Mind map tidak ditemukan.', 404);
    await mm.destroy();
    return ok(res, null, 'Mind map berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus mind map.', 500);
  }
};
