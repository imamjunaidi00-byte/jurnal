'use strict';

const { MappingMapel } = require('../models/index');
const { ok, fail }     = require('../utils/response');
const { Op }           = require('sequelize');

exports.list = async (req, res) => {
  try {
    const list = await MappingMapel.findAll({
      where: { guruId: req.guru.id },
      order: [['nama','ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar mapel.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { nama, kode, deskripsi } = req.body;
    if (!nama) return fail(res, 'Nama mapel wajib diisi.', 400);

    // Cek duplikat (case-insensitive)
    const dup = await MappingMapel.findOne({
      where: { guruId: req.guru.id, nama: { [Op.like]: nama.trim() } },
    });
    if (dup) return fail(res, 'Mapel dengan nama tersebut sudah ada.', 409);

    const mapel = await MappingMapel.create({
      guruId: req.guru.id, nama: nama.trim(), kode: kode || '', deskripsi: deskripsi || '',
    });
    return ok(res, mapel, 'Mapel berhasil ditambahkan.', 201);
  } catch (err) {
    return fail(res, 'Gagal menambahkan mapel.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const mapel = await MappingMapel.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!mapel) return fail(res, 'Mapel tidak ditemukan.', 404);
    await mapel.update(req.body);
    return ok(res, mapel, 'Mapel berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui mapel.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const mapel = await MappingMapel.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!mapel) return fail(res, 'Mapel tidak ditemukan.', 404);
    await mapel.destroy();
    return ok(res, null, 'Mapel berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus mapel.', 500);
  }
};
