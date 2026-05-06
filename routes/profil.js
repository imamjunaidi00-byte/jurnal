const express = require('express');
const router = express.Router();
const Profil = require('../models/Profil');

// GET profil
router.get('/', async (req, res) => {
  try {
    let profil = await Profil.findById('guru');
    if (!profil) {
      profil = await Profil.create({ _id: 'guru' });
    }
    res.json({ success: true, data: profil });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT simpan profil (upsert)
router.put('/', async (req, res) => {
  try {
    const { guru, kelas, kelasMapelMapping, semester, tahunAjaran, bobotNilai, app } = req.body;

    // Bangun update object secara eksplisit agar nested field tersimpan benar
    const update = {};
    if (guru !== undefined) {
      if (guru.nama !== undefined) update['guru.nama'] = guru.nama;
      if (guru.mapel !== undefined) update['guru.mapel'] = guru.mapel;
      if (guru.foto !== undefined) update['guru.foto'] = guru.foto;
    }
    if (kelas !== undefined)              update.kelas = kelas;
    if (kelasMapelMapping !== undefined)  update.kelasMapelMapping = kelasMapelMapping;
    if (semester !== undefined)           update.semester = semester;
    if (tahunAjaran !== undefined)        update.tahunAjaran = tahunAjaran;
    if (bobotNilai !== undefined) {
      if (bobotNilai.pengetahuan !== undefined) update['bobotNilai.pengetahuan'] = Number(bobotNilai.pengetahuan);
      if (bobotNilai.keterampilan !== undefined) update['bobotNilai.keterampilan'] = Number(bobotNilai.keterampilan);
      if (bobotNilai.kehadiran !== undefined)    update['bobotNilai.kehadiran'] = Number(bobotNilai.kehadiran);
    }
    if (app !== undefined) update.app = app;

    const profil = await Profil.findByIdAndUpdate(
      'guru',
      { $set: update },
      { new: true, upsert: true, runValidators: false }
    );
    res.json({ success: true, data: profil });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
