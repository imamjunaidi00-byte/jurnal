'use strict';

const { Config } = require('../models/index');
const { ok, fail } = require('../utils/response');

exports.get = async (req, res) => {
  try {
    const config = await Config.findOne({ where: { guruId: req.guru.id, key: 'aktif' } });
    return ok(res, config?.value || { semester: 'Ganjil', tahunAjaran: '' });
  } catch (err) {
    return fail(res, 'Gagal mengambil konfigurasi.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { semester, tahunAjaran } = req.body;
    if (!semester || !tahunAjaran)
      return fail(res, 'Semester dan tahun ajaran wajib diisi.', 400);

    const [config] = await Config.upsert({
      guruId: req.guru.id,
      key:    'aktif',
      value:  { semester, tahunAjaran },
    });
    return ok(res, { semester, tahunAjaran }, 'Konfigurasi berhasil disimpan.');
  } catch (err) {
    return fail(res, 'Gagal menyimpan konfigurasi.', 500);
  }
};
