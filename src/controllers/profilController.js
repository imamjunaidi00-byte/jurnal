'use strict';

const { Profil, Guru } = require('../models/index');
const { ok, fail } = require('../utils/response');

// ── Format profil agar cocok dengan struktur CONFIG di frontend ───────────────
function formatProfil(profil, guru) {
  return {
    guru: {
      nama:  profil.namaGuru  || guru?.nama || '',
      mapel: profil.mapelGuru || [],
      foto:  profil.fotoGuru  || '',
    },
    kelas:              profil.kelasList         || [],
    kelasMapelMapping:  profil.kelasMapelMapping  || {},
    semester:           profil.semester           || 'Ganjil',
    tahunAjaran:        profil.tahunAjaran         || '',
    bobotNilai: {
      pengetahuan:  profil.bobotPengetahuan  ?? 60,
      keterampilan: profil.bobotKeterampilan ?? 40,
      kehadiran:    profil.bobotKehadiran    ?? 0,
    },
    app:     profil.appData || {},
    // Field raw juga disertakan untuk keperluan update
    _id:     profil.id,
    guruId:  profil.guruId,
  };
}

exports.get = async (req, res) => {
  try {
    let profil = await Profil.findOne({ where: { guruId: req.guru.id } });
    if (!profil) {
      profil = await Profil.create({
        guruId:    req.guru.id,
        namaGuru:  req.guru.nama,
        mapelGuru: [],
        kelasList: [],
        kelasMapelMapping: {},
        appData:   {},
      });
    }
    return ok(res, formatProfil(profil, req.guru));
  } catch (err) {
    console.error('profil.get error:', err.message);
    return fail(res, 'Gagal mengambil profil.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    let profil = await Profil.findOne({ where: { guruId: req.guru.id } });
    if (!profil) profil = await Profil.create({
      guruId: req.guru.id, namaGuru: req.guru.nama,
      mapelGuru: [], kelasList: [], kelasMapelMapping: {}, appData: {},
    });

    // Terima format frontend (nested) atau format flat (langsung field DB)
    const body = req.body;
    const updateData = {};

    // Format nested dari frontend: { guru: { nama, mapel, foto }, ... }
    if (body.guru?.nama     !== undefined) updateData.namaGuru  = body.guru.nama;
    if (body.guru?.mapel    !== undefined) updateData.mapelGuru = Array.isArray(body.guru.mapel) ? body.guru.mapel : [body.guru.mapel];
    if (body.guru?.foto     !== undefined) updateData.fotoGuru  = body.guru.foto;

    // Fields flat
    if (body.namaGuru    !== undefined) updateData.namaGuru  = body.namaGuru;
    if (body.mapelGuru   !== undefined) updateData.mapelGuru = body.mapelGuru;
    if (body.fotoGuru    !== undefined) updateData.fotoGuru  = body.fotoGuru;
    if (body.kelas       !== undefined) updateData.kelasList = body.kelas;
    if (body.kelasList   !== undefined) updateData.kelasList = body.kelasList;
    if (body.kelasMapelMapping !== undefined) updateData.kelasMapelMapping = body.kelasMapelMapping;
    if (body.semester    !== undefined) updateData.semester    = body.semester;
    if (body.tahunAjaran !== undefined) updateData.tahunAjaran = body.tahunAjaran;

    // Bobot nilai — terima flat atau nested
    if (body.bobotNilai?.pengetahuan  !== undefined) updateData.bobotPengetahuan  = body.bobotNilai.pengetahuan;
    if (body.bobotNilai?.keterampilan !== undefined) updateData.bobotKeterampilan = body.bobotNilai.keterampilan;
    if (body.bobotNilai?.kehadiran    !== undefined) updateData.bobotKehadiran    = body.bobotNilai.kehadiran;
    if (body.bobotPengetahuan  !== undefined) updateData.bobotPengetahuan  = body.bobotPengetahuan;
    if (body.bobotKeterampilan !== undefined) updateData.bobotKeterampilan = body.bobotKeterampilan;
    if (body.bobotKehadiran    !== undefined) updateData.bobotKehadiran    = body.bobotKehadiran;

    if (body.app     !== undefined) updateData.appData = body.app;
    if (body.appData !== undefined) updateData.appData = body.appData;

    if (Object.keys(updateData).length > 0) {
      await profil.update(updateData);
    }

    return ok(res, formatProfil(profil, req.guru), 'Profil berhasil diperbarui.');
  } catch (err) {
    console.error('profil.update error:', err.message);
    return fail(res, 'Gagal memperbarui profil.', 500);
  }
};
