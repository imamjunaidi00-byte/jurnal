const Absensi = require('../models/Absensi');
const Siswa = require('../models/Siswa');
const moment = require('moment');

// @desc    Get absensi by kelas and tanggal
// @route   GET /api/absensi
exports.getAbsensi = async (req, res) => {
  try {
    const { kelas, tanggal, semester, tahunAjaran, nisn } = req.query;
    
    let query = {};
    if (kelas) query.kelas = kelas;
    if (tanggal) {
      const [y, m, d] = tanggal.split('-').map(Number);
      query.tanggal = {
        $gte: new Date(y, m - 1, d, 0, 0, 0),
        $lt:  new Date(y, m - 1, d, 23, 59, 59, 999)
      };
    }
    if (semester) query.semester = semester;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;

    // Filter by NISN — lookup siswa first
    if (nisn) {
      const siswa = await Siswa.findOne({ nisn });
      if (!siswa) return res.json({ success: true, count: 0, data: [] });
      query.siswa = siswa._id;
    }

    const absensi = await Absensi.find(query)
      .populate('siswa', 'nama nisn jenisKelamin')
      .sort({ 'siswa.nama': 1 });

    res.json({ success: true, count: absensi.length, data: absensi });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create bulk absensi
// @route   POST /api/absensi/bulk
exports.createBulkAbsensi = async (req, res) => {
  try {
    const { kelas, tanggal, semester, tahunAjaran, data, guruPengampu, mataPelajaran } = req.body;

    // Hapus absensi lama untuk tanggal ini jika ada (upsert)
    await Absensi.deleteMany({
      kelas,
      tanggal: new Date(tanggal),
      mataPelajaran
    });

    const absensiData = data.map(item => ({
      siswa: item.siswaId,
      kelas,
      tanggal: new Date(tanggal),
      semester,
      tahunAjaran,
      status: item.status,
      keterangan: item.keterangan,
      guruPengampu,
      mataPelajaran,
      jamMasuk: item.jamMasuk || moment().format('HH:mm')
    }));

    const absensi = await Absensi.insertMany(absensiData);

    res.json({
      success: true,
      message: `Berhasil menyimpan ${absensi.length} data absensi`,
      data: absensi
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rekap absensi
// @route   GET /api/absensi/rekap
exports.getRekap = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;

    const rekap = await Absensi.getRekap(kelas, semester, tahunAjaran);

    res.json({ success: true, data: rekap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single absensi
// @route   PUT /api/absensi/:id
exports.updateAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!absensi) {
      return res.status(404).json({ success: false, message: 'Data absensi tidak ditemukan' });
    }
    res.json({ success: true, data: absensi });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download rekap absensi Excel
// @route   GET /api/absensi/rekap/download
exports.downloadRekap = async (req, res) => {
  try {
    const xlsx = require('xlsx');
    const path = require('path');
    const fs = require('fs');
    const { kelas, semester, tahunAjaran, bulan, tahun } = req.query;

    let query = {};
    if (kelas) query.kelas = kelas;
    if (semester) query.semester = semester;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (bulan && tahun) {
      const y = parseInt(tahun), m = parseInt(bulan);
      query.tanggal = {
        $gte: new Date(y, m-1, 1),
        $lt:  new Date(y, m, 1)
      };
    } else if (tahun) {
      query.tanggal = {
        $gte: new Date(parseInt(tahun), 0, 1),
        $lt:  new Date(parseInt(tahun)+1, 0, 1)
      };
    }

    const absensi = await Absensi.find(query).populate('siswa', 'nama nisn kelas');

    // Hitung rekap per siswa
    const rekapMap = {};
    absensi.forEach(a => {
      const sid = a.siswa?._id?.toString();
      if (!sid) return;
      if (!rekapMap[sid]) {
        rekapMap[sid] = { nama: a.siswa.nama, nisn: a.siswa.nisn, kelas: a.kelas, hadir:0, sakit:0, izin:0, alpha:0 };
      }
      rekapMap[sid][a.status] = (rekapMap[sid][a.status] || 0) + 1;
    });

    const rows = Object.values(rekapMap).map((r, i) => {
      const total = r.hadir + r.sakit + r.izin + r.alpha;
      return {
        'No': i+1, 'Nama': r.nama, 'NISN': r.nisn, 'Kelas': r.kelas,
        'Hadir': r.hadir, 'Sakit': r.sakit, 'Izin': r.izin, 'Alpha': r.alpha,
        'Total': total, '% Hadir': total ? Math.round((r.hadir/total)*100)+'%' : '0%'
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows.length ? rows : [{'No':'','Nama':'Belum ada data','NISN':'','Kelas':'','Hadir':'','Sakit':'','Izin':'','Alpha':'','Total':'','% Hadir':''}]);
    ws['!cols'] = [{wch:5},{wch:35},{wch:15},{wch:12},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:10}];
    xlsx.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

    const label = bulan && tahun ? `${bulan}-${tahun}` : (tahun || semester || 'semua');
    const fileName = `rekap_absensi_${(kelas||'semua').replace(/\s+/g,'_')}_${label}.xlsx`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    xlsx.writeFile(wb, filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error(err);
      setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
