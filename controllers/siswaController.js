const Siswa = require('../models/Siswa');
const csv = require('csv-parser');
const { Parser } = require('@json2csv/plainjs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// @desc    Get all siswa
// @route   GET /api/siswa
exports.getAllSiswa = async (req, res) => {
  try {
    const { kelas, search, status, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (kelas) query.kelas = kelas;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { nama: { $regex: search, $options: 'i' } },
        { nisn: { $regex: search, $options: 'i' } }
      ];
    }

    const siswa = await Siswa.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ nama: 1 });

    const count = await Siswa.countDocuments(query);

    res.json({
      success: true,
      count: siswa.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: siswa
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single siswa
// @route   GET /api/siswa/:id
exports.getSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findById(req.params.id);
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.json({ success: true, data: siswa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create siswa
// @route   POST /api/siswa
exports.createSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.create(req.body);
    res.status(201).json({ success: true, data: siswa });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'NISN sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update siswa
// @route   PUT /api/siswa/:id
exports.updateSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.json({ success: true, data: siswa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete siswa
// @route   DELETE /api/siswa/:id
exports.deleteSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByIdAndDelete(req.params.id);
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import CSV atau Excel
// @route   POST /api/siswa/import
exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    const ext = path.extname(req.file.originalname || req.file.path).toLowerCase();
    let rows = [];

    if (ext === '.xlsx' || ext === '.xls') {
      const wb = xlsx.readFile(req.file.path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      // header:1 baca semua sebagai array, lalu kita cari baris header manual
      const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Cari baris yang mengandung kolom 'nama' sebagai header
      let headerRowIdx = -1;
      let headers = [];
      for (let i = 0; i < raw.length; i++) {
        const row = raw[i].map(c => c.toString().trim().toLowerCase());
        if (row.includes('nama') && row.includes('nisn')) {
          headerRowIdx = i;
          headers = raw[i].map(c => c.toString().trim());
          break;
        }
      }

      if (headerRowIdx === -1) {
        return res.status(400).json({ success: false, message: 'Format Excel tidak valid. Pastikan ada kolom nama dan nisn.' });
      }

      // Konversi baris data ke object berdasarkan header
      for (let i = headerRowIdx + 1; i < raw.length; i++) {
        const row = raw[i];
        if (row.every(c => c === '' || c === null || c === undefined)) continue; // skip baris kosong
        const obj = {};
        headers.forEach((h, idx) => {
          if (h) obj[h] = row[idx] !== undefined ? row[idx].toString().trim() : '';
        });
        rows.push(obj);
      }
    } else {
      await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', d => results.push(d))
          .on('end', () => { rows = results; resolve(); })
          .on('error', reject);
      });
    }

    // Normalisasi jenisKelamin: terima "Laki-laki"/"laki-laki"/"l" -> "L", "Perempuan"/"p" -> "P"
    const normalizeJK = (val) => {
      const v = (val || '').toString().trim().toLowerCase();
      if (v === 'l' || v === 'laki-laki' || v === 'laki laki' || v === 'male') return 'L';
      if (v === 'p' || v === 'perempuan' || v === 'female' || v === 'wanita') return 'P';
      return v.charAt(0).toUpperCase(); // fallback ambil huruf pertama
    };

    const errors = [];
    const toInsert = [];

    rows.forEach(data => {
      const nama = (data.nama || '').toString().trim();
      const nisn = (data.nisn || '').toString().trim();
      const kelas = (data.kelas || '').toString().trim();
      const jenisKelamin = normalizeJK(data.jenisKelamin);

      if (!nama || !nisn || !kelas) {
        if (nama || nisn) errors.push({ nama, error: 'Data tidak lengkap (nama/nisn/kelas wajib)' });
        return;
      }

      toInsert.push({
        nama,
        nisn,
        nis: (data.nis || '').toString().trim() || undefined,
        kelas,
        jenisKelamin: jenisKelamin || 'L',
        tempatLahir: (data.tempatLahir || '').toString().trim() || undefined,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : undefined,
        agama: (data.agama || '').toString().trim() || undefined,
        alamat: (data.alamat || '').toString().trim() || undefined,
        namaAyah: (data.namaAyah || '').toString().trim() || undefined,
        namaIbu: (data.namaIbu || '').toString().trim() || undefined,
        telpOrtu: (data.telpOrtu || '').toString().trim() || undefined,
        tahunMasuk: data.tahunMasuk ? parseInt(data.tahunMasuk) : undefined,
        status: (data.status || 'Aktif').toString().trim()
      });
    });

    let imported = 0;
    if (toInsert.length > 0) {
      try {
        const result = await Siswa.insertMany(toInsert, { ordered: false, rawResult: true });
        imported = result.insertedCount || toInsert.length;
      } catch (e) {
        imported = e.result?.nInserted || 0;
        if (e.writeErrors) {
          e.writeErrors.forEach(we => errors.push({ error: we.errmsg }));
        }
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      imported,
      failed: errors.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `Berhasil import ${imported} siswa${errors.length > 0 ? `, ${errors.length} gagal` : ''}`
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export to Excel (format sama dengan import)
// @route   GET /api/siswa/export/excel
exports.exportExcel = async (req, res) => {
  try {
    const { kelas } = req.query;
    let query = {};
    if (kelas) query.kelas = kelas;

    const siswa = await Siswa.find(query).lean();

    // Header kolom — selalu ada meski data kosong
    const headers = ['nama','nisn','nis','kelas','jenisKelamin','tempatLahir','tanggalLahir','agama','alamat','namaAyah','namaIbu','telpOrtu','tahunMasuk','status'];

    const data = siswa.map(s => ({
      nama: s.nama || '',
      nisn: s.nisn || '',
      nis: s.nis || '',
      kelas: s.kelas || '',
      jenisKelamin: s.jenisKelamin || '',
      tempatLahir: s.tempatLahir || '',
      tanggalLahir: s.tanggalLahir ? new Date(s.tanggalLahir).toISOString().split('T')[0] : '',
      agama: s.agama || '',
      alamat: s.alamat || '',
      namaAyah: s.namaAyah || '',
      namaIbu: s.namaIbu || '',
      telpOrtu: s.telpOrtu || '',
      tahunMasuk: s.tahunMasuk || '',
      status: s.status || 'Aktif'
    }));

    const wb = xlsx.utils.book_new();

    // Buat sheet dengan header eksplisit agar tetap ada meski data kosong
    const ws = xlsx.utils.json_to_sheet(data, { header: headers });

    // Jika data kosong, tambahkan header row manual
    if (data.length === 0) {
      xlsx.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
      ws['!ref'] = xlsx.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
    }

    ws['!cols'] = [
      {wch:30},{wch:15},{wch:12},{wch:14},{wch:14},
      {wch:15},{wch:14},{wch:10},{wch:35},{wch:25},
      {wch:25},{wch:15},{wch:12},{wch:10}
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Data Siswa');

    const fileName = `data_siswa_${kelas ? kelas.replace(/\s+/g,'_') : 'semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    xlsx.writeFile(wb, filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error('Download error:', err);
      setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export to CSV
// @route   GET /api/siswa/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const { kelas } = req.query;
    let query = {};
    if (kelas) query.kelas = kelas;

    const siswa = await Siswa.find(query).lean();
    
    const parser = new Parser();
    const csv = parser.parse(siswa);

    res.header('Content-Type', 'text/csv');
    res.attachment(`data_siswa_${kelas || 'semua'}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};