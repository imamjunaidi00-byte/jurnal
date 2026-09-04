'use strict';

const { Profil } = require('../models/index');
const { ok, fail } = require('../utils/response');

exports.get = async (req, res) => {
  try {
    let profil = await Profil.findOne({ where: { guruId: req.guru.id } });
    if (!profil) {
      profil = await Profil.create({
        guruId:    req.guru.id,
        namaGuru:  req.guru.nama,
        mapelGuru: [],
        kelasList: [],
      });
    }
    return ok(res, profil);
  } catch (err) {
    return fail(res, 'Gagal mengambil profil.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    let profil = await Profil.findOne({ where: { guruId: req.guru.id } });
    if (!profil) profil = await Profil.create({ guruId: req.guru.id, namaGuru: req.guru.nama });

    // Partial update — hanya field yang dikirim
    const allowed = ['namaGuru','mapelGuru','fotoGuru','kelasList','kelasMapelMapping',
                     'semester','tahunAjaran','bobotPengetahuan','bobotKeterampilan',
                     'bobotKehadiran','appData'];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }
    await profil.update(updateData);
    return ok(res, profil, 'Profil berhasil diperbarui.');
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal memperbarui profil.', 500);
  }
};
