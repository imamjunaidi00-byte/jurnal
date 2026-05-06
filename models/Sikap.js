const mongoose = require('mongoose');

const sikapSchema = new mongoose.Schema({
  siswa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siswa',
    required: true
  },
  kelas: {
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
  // Aspek Spiritual
  berdoa: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  toleransi: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  bersyukur: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  // Aspek Sosial
  jujur: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  disiplin: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  tanggungJawab: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  santun: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  peduli: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  percayaDiri: { type: String, enum: ['SB', 'B', 'C', 'K'], default: 'B' },
  // Deskripsi otomatis
  deskripsiSpiritual: { type: String },
  deskripsiSosial: { type: String },
  // Nilai akhir
  nilaiSpiritual: { type: String, enum: ['SB', 'B', 'C', 'K'] },
  nilaiSosial: { type: String, enum: ['SB', 'B', 'C', 'K'] }
}, {
  timestamps: true
});

// Pre-save untuk generate deskripsi
sikapSchema.pre('save', function(next) {
  const mapNilai = { 'SB': 4, 'B': 3, 'C': 2, 'K': 1 };
  const mapPredikat = { 4: 'SB', 3: 'B', 2: 'C', 1: 'K' };
  
  // Hitung rata-rata spiritual
  const spiritual = [this.berdoa, this.toleransi, this.bersyukur];
  const avgSpiritual = Math.round(spiritual.reduce((a, b) => a + mapNilai[b], 0) / spiritual.length);
  this.nilaiSpiritual = mapPredikat[avgSpiritual];
  
  // Hitung rata-rata sosial
  const sosial = [this.jujur, this.disiplin, this.tanggungJawab, this.santun, this.peduli, this.percayaDiri];
  const avgSosial = Math.round(sosial.reduce((a, b) => a + mapNilai[b], 0) / sosial.length);
  this.nilaiSosial = mapPredikat[avgSosial];
  
  // Generate deskripsi
  const deskripsiMap = {
    'SB': 'Sangat Baik',
    'B': 'Baik',
    'C': 'Cukup',
    'K': 'Kurang'
  };
  
  this.deskripsiSpiritual = `Anak ${deskripsiMap[this.nilaiSpiritual].toLowerCase()} dalam sikap spiritual`;
  this.deskripsiSosial = `Anak ${deskripsiMap[this.nilaiSosial].toLowerCase()} dalam sikap sosial`;
  
  next();
});

module.exports = mongoose.model('Sikap', sikapSchema);