const Nilai = require('../models/Nilai');
const Siswa = require('../models/Siswa');
const { Parser } = require('@json2csv/plainjs');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// @desc    Get nilai by filter
// @route   GET /api/nilai
exports.getNilai = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran, mataPelajaran, nisn } = req.query;
    
    let query = {};
    if (kelas) query.kelas = kelas;
    if (semester) query.semester = semester;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (mataPelajaran) query.mataPelajaran = mataPelajaran;

    // Filter by NISN — lookup siswa first
    if (nisn) {
      const siswa = await Siswa.findOne({ nisn });
      if (!siswa) return res.json({ success: true, count: 0, data: [] });
      query.siswa = siswa._id;
    }

    const nilai = await Nilai.find(query)
      .populate('siswa', 'nama nisn')
      .sort({ 'siswa.nama': 1 });

    res.json({ success: true, count: nilai.length, data: nilai });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update nilai (upsert)
// @route   POST /api/nilai
exports.createOrUpdateNilai = async (req, res) => {
  try {
    const { siswa, kelas, semester, tahunAjaran, mataPelajaran, guru, ...nilaiData } = req.body;

    // Cari nilai existing
    let nilai = await Nilai.findOne({
      siswa,
      kelas,
      semester,
      tahunAjaran,
      mataPelajaran
    });

    if (nilai) {
      // Update existing
      Object.assign(nilai, nilaiData);
      await nilai.save();
    } else {
      // Create new
      nilai = await Nilai.create({
        siswa,
        kelas,
        semester,
        tahunAjaran,
        mataPelajaran,
        guru,
        ...nilaiData
      });
    }

    res.json({ success: true, data: nilai });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk update nilai
// @route   POST /api/nilai/bulk
exports.bulkUpdateNilai = async (req, res) => {
  try {
    const { data } = req.body; // Array of nilai objects
    const results = [];

    for (const item of data) {
      const { siswa, kelas, semester, tahunAjaran, mataPelajaran, guru, ...nilaiData } = item;
      
      let nilai = await Nilai.findOne({ siswa, kelas, semester, tahunAjaran, mataPelajaran });
      if (nilai) {
        Object.assign(nilai, nilaiData, { guru });
        await nilai.save(); // triggers pre-save middleware
      } else {
        nilai = await Nilai.create({ siswa, kelas, semester, tahunAjaran, mataPelajaran, guru, ...nilaiData });
      }
      results.push(nilai);
    }

    res.json({
      success: true,
      message: `Berhasil update ${results.length} data nilai`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download nilai Excel
// @route   GET /api/nilai/download
exports.downloadNilai = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran, mataPelajaran } = req.query;

    // Ambil semua siswa di kelas ini
    const siswaDiKelas = await Siswa.find({ kelas }).sort({ nama: 1 }).lean();

    // Ambil nilai yang sudah ada
    const query = { kelas };
    if (semester) query.semester = semester;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (mataPelajaran) query.mataPelajaran = mataPelajaran;

    const nilaiList = await Nilai.find(query)
      .populate('siswa', 'nama nisn')
      .lean();

    // Map nilai per siswa
    const nilaiMap = {};
    nilaiList.forEach(n => {
      const sid = n.siswa?._id?.toString();
      if (sid) nilaiMap[sid] = n;
    });

    // Generate data — semua siswa, nilai 0 jika belum ada
    const data = siswaDiKelas.map((s, index) => {
      const n = nilaiMap[s._id.toString()] || {};
      const uh = n.uh || 0, pts = n.pts || 0, pas = n.pas || 0;
      const praktek = n.praktek || 0, proyek = n.proyek || 0, portofolio = n.portofolio || 0;
      const naPenget = Math.round(uh*0.2 + pts*0.3 + pas*0.5);
      const naKeter = Math.round((praktek + proyek + portofolio) / 3);
      const naAkhir = Math.round(naPenget*0.6 + naKeter*0.4);
      const predikat = naAkhir>=85?'A':naAkhir>=75?'B':naAkhir>=65?'C':'D';
      return {
        'No': index + 1,
        'Nama': s.nama,
        'NISN': s.nisn || '',
        'Kelas': kelas,
        'UH': uh, 'PTS': pts, 'PAS': pas,
        'NA Pengetahuan': naPenget,
        'Praktek': praktek, 'Proyek': proyek, 'Portofolio': portofolio,
        'NA Keterampilan': naKeter,
        'NA Akhir': naAkhir,
        'Predikat': predikat
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    ws['!cols'] = [
      {wch:5},{wch:32},{wch:14},{wch:12},
      {wch:6},{wch:6},{wch:6},{wch:14},
      {wch:8},{wch:8},{wch:10},{wch:14},
      {wch:10},{wch:8}
    ];
    xlsx.utils.book_append_sheet(wb, ws, 'Nilai Siswa');

    const safeName = (kelas||'kelas').replace(/\s+/g,'_');
    const fileName = `nilai_${safeName}_${semester||'smt'}_${(tahunAjaran||'').replace(/\//g,'-')}.xlsx`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    xlsx.writeFile(wb, filePath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.download(filePath, fileName, (err) => {
      if (err) console.error('Download error:', err);
      setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ranking
// @route   GET /api/nilai/ranking
exports.getRanking = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran, limit = 10 } = req.query;

    const ranking = await Nilai.aggregate([
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
          rataRata: { $avg: '$naAkhir' },
          totalMapel: { $sum: 1 }
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
      { $unwind: '$siswa' },
      { $sort: { rataRata: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, data: ranking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};