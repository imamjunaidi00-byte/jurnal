const mongoose = require('mongoose');

// Node dalam mind map (rekursif)
const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  children: { type: mongoose.Schema.Types.Mixed, default: [] }
}, { _id: false });

const mindMapSchema = new mongoose.Schema({
  judul: { type: String, required: true, trim: true },
  mataPelajaran: { type: String, trim: true, default: '' },
  kelas: { type: String, trim: true, default: '' },
  deskripsi: { type: String, trim: true, default: '' },
  guru: { type: String, trim: true, default: '' },
  nodes: { type: mongoose.Schema.Types.Mixed, default: {} }, // root node tree
  warna: { type: String, default: '#3b82f6' }
}, { timestamps: true });

module.exports = mongoose.model('MindMap', mindMapSchema);
