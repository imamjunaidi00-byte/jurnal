'use strict';

const { GuruKelas, Kelas, MappingMapel } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.aktif !== undefined) where.aktif = req.query.aktif === 'true';

    const list = await GuruKelas.findAll({
      where,
      include: [
        { model: Kelas,        as: 'kelasRef',     attributes: ['id','nama','tingkat','jurusan','tahunAjaran'] },
        { model: MappingMapel, as: 'mappingMapel', attributes: ['id','nama','kode'] },
      ],
      order: [['createdAt','DESC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil data kelas guru.', 500);
  }
};

exports.kelasList = async (req, res) => {
  try {
    const list = await GuruKelas.findAll({
      where:      { guruId: req.guru.id, aktif: true },
      include:    [{ model: Kelas, as: 'kelasRef', attributes: ['id','nama','tingkat','jurusan'] }],
      attributes: ['kelasId'],
      group:      ['kelasId'],
    });
    return ok(res, list.map(r => r.kelasRef));
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar kelas.', 500);
  }
};

exports.mapelByKelas = async (req, res) => {
  try {
    const { kelasId } = req.query;
    if (!kelasId) return fail(res, 'kelasId wajib diisi.', 400);
    const list = await GuruKelas.findAll({
      where: { guruId: req.guru.id, kelasId, aktif: true },
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil mapel per kelas.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { kelasId, mappingMapelId, tahunAjaran, semester } = req.body;
    if (!kelasId || !mappingMapelId || !tahunAjaran || !semester)
      return fail(res, 'kelasId, mappingMapelId, tahunAjaran, dan semester wajib diisi.', 400);

    const kelas  = await Kelas.findByPk(kelasId);
    if (!kelas)  return fail(res, 'Kelas tidak ditemukan.', 404);
    const mapel  = await MappingMapel.findOne({ where: { id: mappingMapelId, guruId: req.guru.id } });
    if (!mapel)  return fail(res, 'Mata pelajaran tidak ditemukan.', 404);

    const existing = await GuruKelas.findOne({
      where: { guruId: req.guru.id, kelasId, mappingMapelId, tahunAjaran, semester },
    });
    if (existing) return fail(res, 'Penugasan untuk kelas dan mapel ini sudah ada.', 409);

    const gk = await GuruKelas.create({
      guruId: req.guru.id, kelasId, mappingMapelId,
      mapelNama: mapel.nama, mapelKode: mapel.kode || '',
      tahunAjaran, semester, aktif: true,
    });
    return ok(res, gk, 'Penugasan berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat penugasan.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const gk = await GuruKelas.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!gk) return fail(res, 'Penugasan tidak ditemukan.', 404);
    await gk.update(req.body);
    return ok(res, gk, 'Penugasan berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui penugasan.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const gk = await GuruKelas.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!gk) return fail(res, 'Penugasan tidak ditemukan.', 404);
    await gk.destroy();
    return ok(res, null, 'Penugasan berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus penugasan.', 500);
  }
};
