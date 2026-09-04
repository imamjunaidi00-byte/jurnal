'use strict';

const { Jurnal, sequelize } = require('../models/index');
const { ok, fail, paginate } = require('../utils/response');
const { Op, fn, col } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || 1, 10);
    const limit = parseInt(req.query.limit || 20, 10);
    const where = { guruId: req.guru.id };

    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;
    if (req.query.kelas)       where.kelas       = req.query.kelas;
    if (req.query.bulan) {
      const [year, month] = req.query.bulan.split('-');
      where.tanggal = {
        [Op.between]: [
          `${year}-${month}-01`,
          `${year}-${month}-31`,
        ],
      };
    }

    const { count, rows } = await Jurnal.findAndCountAll({
      where, order: [['tanggal','DESC']], limit, offset: (page - 1) * limit,
    });
    return paginate(res, rows, count, page, limit);
  } catch (err) {
    return fail(res, 'Gagal mengambil data jurnal.', 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const jurnal = await Jurnal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!jurnal) return fail(res, 'Jurnal tidak ditemukan.', 404);
    return ok(res, jurnal);
  } catch (err) {
    return fail(res, 'Gagal mengambil jurnal.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const jurnal = await Jurnal.create({ ...req.body, guruId: req.guru.id, guru: req.body.guru || req.guru.nama });
    return ok(res, jurnal, 'Jurnal berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat jurnal.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const jurnal = await Jurnal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!jurnal) return fail(res, 'Jurnal tidak ditemukan.', 404);
    await jurnal.update(req.body);
    return ok(res, jurnal, 'Jurnal berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui jurnal.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const jurnal = await Jurnal.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!jurnal) return fail(res, 'Jurnal tidak ditemukan.', 404);
    await jurnal.destroy();
    return ok(res, null, 'Jurnal berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus jurnal.', 500);
  }
};
