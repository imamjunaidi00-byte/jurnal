const mongoose = require('mongoose');

const jurnalSchema = new mongoose.Schema({
  tanggal: { type: Date, required: true },
  hari: { type: String, required: true },
  jamMulai: { type: String, required: true },
  jamSelesai: { type: String, required: true },
  mataPelajaran: { type: String, required: true },
  kelas: { type: String, required: true },
  ruangan: { type: String, default: '' },
  guru: { type: String, required: true },
  semester: { type: String, default: 'Genap' },
  tahunAjaran: { type: String, default: '2025/2026' },
  // Isi jurnal
  materiPokok: { type: String, default: '' },       // Materi/topik yang diajarkan
  kegiatanPembelajaran: { type: String, default: '' }, // Kegiatan pembelajaran
  metodePembelajaran: { type: String, default: 'Ceramah' },
  mediaPembelajaran: { type: String, default: '' },
  hasilPembelajaran: { type: String, default: '' },  // Catatan hasil/evaluasi
  jumlahHadir: { type: Number, default: 0 },
  jumlahSakit: { type: Number, default: 0 },
  jumlahIzin:  { type: Number, default: 0 },
  jumlahAlpha: { type: Number, default: 0 },
  jumlahSiswa: { type: Number, default: 0 },
  catatan: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'selesai'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Jurnal', jurnalSchema);
