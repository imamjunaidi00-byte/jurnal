const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const getDb = () => mongoose.connection.db;
const col = () => getDb().collection('jadwals');

// Mendapatkan semua jadwal
exports.getAllJadwal = async (req, res) => {
  try {
    const { hari, guru, kelas, tahunAjaran, semester } = req.query;
    let filter = {};
    if (hari) filter.hari = hari;
    if (guru) filter.guru = new RegExp(guru, 'i');
    if (kelas) filter.kelas = kelas;
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = semester;
    const jadwal = await col().find(filter).sort({ hari: 1, jamMulai: 1 }).toArray();
    res.json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mendapatkan jadwal berdasarkan ID
exports.getJadwalById = async (req, res) => {
  try {
    const jadwal = await col().findOne({ _id: new ObjectId(req.params.id) });
    if (!jadwal) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    res.json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Membuat jadwal baru
exports.createJadwal = async (req, res) => {
  try {
    const { hari, jamMulai, jamSelesai, mataPelajaran, kelas, guru, ruangan, semester, tahunAjaran, catatan } = req.body;
    const result = await col().insertOne({
      hari, jamMulai, jamSelesai, mataPelajaran,
      kelas: String(kelas), // pastikan string
      guru, ruangan, semester, tahunAjaran,
      catatan: catatan || '',
      aktif: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const jadwal = await col().findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update jadwal
exports.updateJadwal = async (req, res) => {
  try {
    const { id } = req.params;
    const { hari, jamMulai, jamSelesai, mataPelajaran, kelas, guru, ruangan, semester, tahunAjaran, catatan } = req.body;
    const updateFields = { updatedAt: new Date() };
    if (hari) updateFields.hari = hari;
    if (jamMulai) updateFields.jamMulai = jamMulai;
    if (jamSelesai) updateFields.jamSelesai = jamSelesai;
    if (mataPelajaran) updateFields.mataPelajaran = mataPelajaran;
    if (kelas) updateFields.kelas = String(kelas); // pastikan string
    if (guru) updateFields.guru = guru;
    if (ruangan) updateFields.ruangan = ruangan;
    if (semester) updateFields.semester = semester;
    if (tahunAjaran) updateFields.tahunAjaran = tahunAjaran;
    if (catatan !== undefined) updateFields.catatan = catatan;

    const result = await col().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hapus jadwal
exports.deleteJadwal = async (req, res) => {
  try {
    const result = await col().findOneAndDelete({ _id: new ObjectId(req.params.id) });
    if (!result) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mendapatkan jadwal berdasarkan hari
exports.getJadwalByHari = async (req, res) => {
  try {
    const { hari } = req.params;
    const { tahunAjaran, semester } = req.query;
    let filter = { hari, aktif: true };
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = semester;
    const jadwal = await col().find(filter).sort({ jamMulai: 1 }).toArray();
    res.json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mendapatkan jadwal berdasarkan guru
exports.getJadwalByGuru = async (req, res) => {
  try {
    const { guru } = req.params;
    const { tahunAjaran, semester } = req.query;
    let filter = { guru: new RegExp(guru, 'i'), aktif: true };
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = semester;
    const jadwal = await col().find(filter).sort({ hari: 1, jamMulai: 1 }).toArray();
    res.json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mendapatkan jadwal berdasarkan kelas
exports.getJadwalByKelas = async (req, res) => {
  try {
    const { kelasId } = req.params;
    const { tahunAjaran, semester } = req.query;
    let filter = { kelas: kelasId, aktif: true };
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = semester;
    const jadwal = await col().find(filter).sort({ hari: 1, jamMulai: 1 }).toArray();
    res.json({ success: true, data: jadwal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
