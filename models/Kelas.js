const mongoose = require('mongoose');

const kelasSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    unique: true
  },
  tingkat: {
    type: Number,
    enum: [10, 11, 12],
    required: true
  },
  jurusan: {
    type: String,
    required: true,
    enum: ['TKJ', 'TKRO', 'KULINER', 'TPTUP']
  },
  rombel: {
    type: String,
    default: '1'
  },
  waliKelas: {
    type: String
  },
  tahunAjaran: {
    type: String,
    required: true
  },
  jumlahSiswa: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Kelas', kelasSchema);