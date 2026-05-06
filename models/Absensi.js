const mongoose = require('mongoose');

const absensiSchema = new mongoose.Schema({
  siswa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siswa',
    required: true
  },
  kelas: {
    type: String,
    required: true
  },
  tanggal: {
    type: Date,
    required: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['Ganjil', 'Genap']
  },
  tahunAjaran: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['hadir', 'sakit', 'izin', 'alpha'],
    default: 'hadir'
  },
  keterangan: {
    type: String,
    trim: true
  },
  jamMasuk: {
    type: String,
    default: null
  },
  jamPulang: {
    type: String,
    default: null
  },
  guruPengampu: {
    type: String,
    required: true
  },
  mataPelajaran: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index untuk mencegah duplikasi absensi
absensiSchema.index({ siswa: 1, tanggal: 1, mataPelajaran: 1 }, { unique: true });

// Static method untuk rekap absensi
absensiSchema.statics.getRekap = async function(kelas, semester, tahunAjaran) {
  return this.aggregate([
    {
      $match: {
        kelas,
        semester,
        tahunAjaran
      }
    },
    {
      $group: {
        _id: '$siswa',
        totalHadir: { $sum: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] } },
        totalSakit: { $sum: { $cond: [{ $eq: ['$status', 'sakit'] }, 1, 0] } },
        totalIzin: { $sum: { $cond: [{ $eq: ['$status', 'izin'] }, 1, 0] } },
        totalAlpha: { $sum: { $cond: [{ $eq: ['$status', 'alpha'] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: 'siswas',
        localField: '_id',
        foreignField: '_id',
        as: 'siswa'
      }
    },
    {
      $unwind: '$siswa'
    }
  ]);
};

module.exports = mongoose.model('Absensi', absensiSchema);