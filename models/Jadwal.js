const mongoose = require('mongoose');

const jadwalSchema = new mongoose.Schema({
  hari: {
    type: String,
    required: true,
    enum: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  },
  jamMulai: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  jamSelesai: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  mataPelajaran: {
    type: String,
    required: true
  },
  kelas: {
    type: String,
    required: true
  },
  guru: {
    type: String,
    required: true
  },
  ruangan: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    enum: ['Ganjil', 'Genap'],
    required: true
  },
  tahunAjaran: {
    type: String,
    required: true
  },
  aktif: {
    type: Boolean,
    default: true
  },
  catatan: {
    type: String
  }
}, {
  timestamps: true
});

// Index untuk mencegah jadwal bentrok
jadwalSchema.index({ 
  hari: 1, 
  jamMulai: 1, 
  jamSelesai: 1, 
  ruangan: 1, 
  tahunAjaran: 1, 
  semester: 1 
});

// Index untuk mencegah guru mengajar di waktu yang sama
jadwalSchema.index({ 
  hari: 1, 
  jamMulai: 1, 
  jamSelesai: 1, 
  guru: 1, 
  tahunAjaran: 1, 
  semester: 1 
});

module.exports = mongoose.model('Jadwal', jadwalSchema);