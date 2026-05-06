const mongoose = require('mongoose');

const nilaiSchema = new mongoose.Schema({
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
  mataPelajaran: {
    type: String,
    required: true
  },
  guru: {
    type: String,
    required: true
  },
  // Nilai Pengetahuan
  uh: { type: Number, min: 0, max: 100, default: 0 }, // Ulangan Harian
  pts: { type: Number, min: 0, max: 100, default: 0 }, // PTS
  pas: { type: Number, min: 0, max: 100, default: 0 }, // PAS
  // Nilai Keterampilan
  praktek: { type: Number, min: 0, max: 100, default: 0 },
  proyek: { type: Number, min: 0, max: 100, default: 0 },
  portofolio: { type: Number, min: 0, max: 100, default: 0 },
  // Nilai Akhir (otomatis dihitung)
  naPengetahuan: { type: Number, min: 0, max: 100 },
  naKeterampilan: { type: Number, min: 0, max: 100 },
  naAkhir: { type: Number, min: 0, max: 100 },
  predikat: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] },
  deskripsi: { type: String },
  // Detail UH dan nilai huruf
  uhDetail: { type: String, default: '' }, // JSON string: {"UH 1":"A","UH 2":"B+"}
  praktekGrade: { type: String, default: '' },
  proyekGrade: { type: String, default: '' },
  portofolioGrade: { type: String, default: '' },
  // Visibility control
  tampilkan: { type: Boolean, default: false } // Guru bisa set true/false untuk publish nilai ke siswa
}, {
  timestamps: true
});

// Pre-save middleware untuk hitung otomatis
nilaiSchema.pre('save', function(next) {
  // Hitung NA Pengetahuan (UH 20%, PTS 30%, PAS 50%)
  this.naPengetahuan = Math.round((this.uh * 0.2) + (this.pts * 0.3) + (this.pas * 0.5));
  
  // Hitung NA Keterampilan (rata-rata)
  this.naKeterampilan = Math.round((this.praktek + this.proyek + this.portofolio) / 3);
  
  // Hitung NA Akhir (60% Pengetahuan + 40% Keterampilan)
  this.naAkhir = Math.round((this.naPengetahuan * 0.6) + (this.naKeterampilan * 0.4));
  
  // Tentukan Predikat
  if (this.naAkhir >= 85) this.predikat = 'A';
  else if (this.naAkhir >= 75) this.predikat = 'B';
  else if (this.naAkhir >= 65) this.predikat = 'C';
  else if (this.naAkhir >= 50) this.predikat = 'D';
  else this.predikat = 'E';
  
  next();
});

// Index
nilaiSchema.index({ siswa: 1, semester: 1, tahunAjaran: 1, mataPelajaran: 1 }, { unique: true });

module.exports = mongoose.model('Nilai', nilaiSchema);