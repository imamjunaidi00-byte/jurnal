const mongoose = require('mongoose');

const siswaSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama siswa wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama tidak boleh lebih dari 100 karakter']
  },
  nisn: {
    type: String,
    required: [true, 'NISN wajib diisi'],
    unique: true,
    trim: true
  },
  nis: {
    type: String,
    trim: true
  },
  kelas: {
    type: String,
    required: [true, 'Kelas wajib diisi'],
    trim: true
  },
  jenisKelamin: {
    type: String,
    enum: ['L', 'P'],
    required: [true, 'Jenis kelamin wajib dipilih']
  },
  tempatLahir: {
    type: String,
    trim: true
  },
  tanggalLahir: {
    type: Date
  },
  agama: {
    type: String,
    enum: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
  },
  alamat: {
    type: String,
    trim: true
  },
  namaAyah: {
    type: String,
    trim: true
  },
  namaIbu: {
    type: String,
    trim: true
  },
  telpOrtu: {
    type: String,
    trim: true
  },
  tahunMasuk: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Aktif', 'Nonaktif', 'Lulus', 'Keluar'],
    default: 'Aktif'
  },
  foto: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual untuk umur
siswaSchema.virtual('umur').get(function() {
  if (!this.tanggalLahir) return null;
  const today = new Date();
  const birthDate = new Date(this.tanggalLahir);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index untuk pencarian cepat
siswaSchema.index({ nama: 'text', nisn: 'text' });

module.exports = mongoose.model('Siswa', siswaSchema);