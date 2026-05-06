const Sikap = require('../models/Sikap');

// @desc    Get sikap by filter
// @route   GET /api/sikap
exports.getSikap = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    
    let query = {};
    if (kelas) query.kelas = kelas;
    if (semester) query.semester = semester;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;

    const sikap = await Sikap.find(query)
      .populate('siswa', 'nama nisn jenisKelamin')
      .sort({ 'siswa.nama': 1 });

    res.json({ success: true, count: sikap.length, data: sikap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update sikap
// @route   POST /api/sikap
exports.createOrUpdateSikap = async (req, res) => {
  try {
    const { siswa, kelas, semester, tahunAjaran, ...sikapData } = req.body;

    let sikap = await Sikap.findOneAndUpdate(
      { siswa, kelas, semester, tahunAjaran },
      { ...sikapData, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: sikap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk update sikap
// @route   POST /api/sikap/bulk
exports.bulkUpdateSikap = async (req, res) => {
  try {
    const { data } = req.body;
    const results = [];

    for (const item of data) {
      const { siswa, kelas, semester, tahunAjaran, ...sikapData } = item;
      
      let sikap = await Sikap.findOneAndUpdate(
        { siswa, kelas, semester, tahunAjaran },
        { ...sikapData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      
      results.push(sikap);
    }

    res.json({
      success: true,
      message: `Berhasil update ${results.length} data sikap`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};