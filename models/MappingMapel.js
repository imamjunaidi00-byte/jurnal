const mongoose = require('mongoose');

const mappingMapelSchema = new mongoose.Schema({
  nama: { type: String, required: true, trim: true },
  kode: { type: String, trim: true, default: '' },
  deskripsi: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('MappingMapel', mappingMapelSchema);
