const mongoose = require('mongoose');

const profilSchema = new mongoose.Schema({
  _id: { type: String, default: 'guru' },
  guru: {
    nama: { type: String, default: '' },
    mapel: { type: [String], default: [] },
    foto: { type: String, default: '' }
  },
  kelas: { type: [String], default: [] },
  kelasMapelMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  semester: { type: String, default: 'Ganjil' },
  tahunAjaran: { type: String, default: '' },
  bobotNilai: {
    pengetahuan: { type: Number, default: 60 },
    keterampilan: { type: Number, default: 40 },
    kehadiran: { type: Number, default: 0 }
  },
  app: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Profil', profilSchema);
