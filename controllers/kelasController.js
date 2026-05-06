const Kelas = require('../models/Kelas');

exports.getAllKelas = async (req, res) => {
  try {
    const kelas = await Kelas.find().sort({ tingkat: 1, jurusan: 1, rombel: 1 });
    res.json({ success: true, data: kelas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createKelas = async (req, res) => {
  try {
    const kelas = await Kelas.create(req.body);
    res.status(201).json({ success: true, data: kelas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};