'use strict';

const path = require('path');
const fs   = require('fs');
const { Nilai, Siswa, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { writeExcel, readExcel } = require('../utils/excel');
const { Op, fn, col } = require('sequelize');

// Fungsi helper hitung nilai akhir (sama dengan model hook)
function hitungNilaiRow(row) {
  const uh  = Math.min(100, Math.max(0, Number(row.uh  || 0)));
  const pts = Math.min(100, Math.max(0, Number(row.pts || 0)));
  const pas = Math.min(100, Math.max(0, Number(row.pas || 0)));

  const naPengetahuan  = Math.round((uh * 0.2) + (pts * 0.3) + (pas * 0.5));

  const praktek    = Math.min(100, Math.max(0, Number(row.praktek    || 0)));
  const proyek     = Math.min(100, Math.max(0, Number(row.proyek     || 0)));
  const portofolio = Math.min(100, Math.max(0, Number(row.portofolio || 0)));
  const naKeterampilan = Math.round((praktek + proyek + portofolio) / 3);

  const naAkhir = Math.round((naPengetahuan * 0.6) + (naKeterampilan * 0.4));

  let predikat;
  if      (naAkhir >= 85) predikat = 'A';
  else if (naAkhir >= 75) predikat = 'B';
  else if (naAkhir >= 65) predikat = 'C';
  else if (naAkhir >= 50) predikat = 'D';
  else                    predikat = 'E';

  return { ...row, uh, pts, pas, praktek, proyek, portofolio, naPengetahuan, naKeterampilan, naAkhir, predikat };
}

exports.list = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.kelas)         where.kelas         = req.query.kelas;
    if (req.query.semester)      where.semester      = req.query.semester;
    if (req.query.tahunAjaran)   where.tahunAjaran   = req.query.tahunAjaran;
    if (req.query.mataPelajaran) where.mataPelajaran = req.query.mataPelajaran;

    const list = await Nilai.findAll({
      where,
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'] }],
      order:   [[{ model: Siswa, as: 'siswaRef' }, 'nama', 'ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil data nilai.', 500);
  }
};

// POST /api/nilai — create or update (upsert)
exports.save = async (req, res) => {
  try {
    const { siswaId, kelas, semester, tahunAjaran, mataPelajaran } = req.body;
    if (!siswaId || !kelas || !semester || !tahunAjaran || !mataPelajaran)
      return fail(res, 'Data tidak lengkap.', 400);

    const [nilai, created] = await Nilai.upsert({
      ...req.body,
      guruId: req.guru.id,
      guru:   req.body.guru || req.guru.nama,
    }, { returning: true });

    const code = created ? 201 : 200;
    return ok(res, nilai, created ? 'Nilai berhasil ditambahkan.' : 'Nilai berhasil diperbarui.', code);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menyimpan nilai.', 500);
  }
};

// POST /api/nilai/bulk
exports.bulkSave = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return fail(res, 'items wajib diisi.', 400);

    const rows = items.map(item => {
      const row = { ...item, guruId: req.guru.id, guru: item.guru || req.guru.nama };
      // Normalisasi: frontend bisa kirim 'siswa' atau 'siswaId'
      if (row.siswa && !row.siswaId) { row.siswaId = row.siswa; delete row.siswa; }
      return row;
    });

    // upsert menggunakan updateOnDuplicate
    const fields = ['uh','pts','pas','praktek','proyek','portofolio',
                    'naPengetahuan','naKeterampilan','naAkhir','predikat',
                    'deskripsi','uhDetail','praktekGrade','proyekGrade',
                    'portofolioGrade','tampilkan','guru','updatedAt'];
    await Nilai.bulkCreate(rows, { updateOnDuplicate: fields });

    return ok(res, null, `${rows.length} nilai berhasil disimpan.`);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menyimpan nilai bulk.', 500);
  }
};

// GET /api/nilai/ranking
exports.ranking = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran, mataPelajaran } = req.query;
    const where = { guruId: req.guru.id };
    if (kelas)         where.kelas         = kelas;
    if (semester)      where.semester      = semester;
    if (tahunAjaran)   where.tahunAjaran   = tahunAjaran;
    if (mataPelajaran) where.mataPelajaran = mataPelajaran;

    const list = await Nilai.findAll({
      where,
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'] }],
      order:   [['naAkhir','DESC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil ranking.', 500);
  }
};

// GET /api/nilai/download
exports.download = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.kelas)         where.kelas         = req.query.kelas;
    if (req.query.semester)      where.semester      = req.query.semester;
    if (req.query.tahunAjaran)   where.tahunAjaran   = req.query.tahunAjaran;
    if (req.query.mataPelajaran) where.mataPelajaran = req.query.mataPelajaran;

    const list = await Nilai.findAll({
      where,
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['nama','nisn'] }],
      order:   [[{ model: Siswa, as: 'siswaRef' }, 'nama', 'ASC']],
      raw: true, nest: true,
    });
    const data = list.map((n, i) => ({
      No: i + 1,
      Nama: n.siswaRef.nama, NISN: n.siswaRef.nisn,
      'Mata Pelajaran': n.mataPelajaran, Kelas: n.kelas,
      'UH': n.uh, 'PTS': n.pts, 'PAS': n.pas,
      'Praktek': n.praktek, 'Proyek': n.proyek, 'Portofolio': n.portofolio,
      'NA Pengetahuan': n.naPengetahuan, 'NA Keterampilan': n.naKeterampilan,
      'NA Akhir': n.naAkhir, 'Predikat': n.predikat,
    }));
    const buffer = writeExcel(data, 'Nilai');
    res.setHeader('Content-Disposition', 'attachment; filename="nilai.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    return fail(res, 'Gagal mengunduh nilai.', 500);
  }
};

// GET /api/nilai/template?kelas=X_KULINER_2&semester=Ganjil&tahunAjaran=2026/2027
// Download template Excel kosong yang sudah berisi daftar siswa sesuai kelas
exports.downloadTemplate = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    if (!kelas || !semester || !tahunAjaran)
      return fail(res, 'kelas, semester, dan tahunAjaran wajib diisi.', 400);

    // Ambil daftar siswa kelas ini
    const siswaList = await Siswa.findAll({
      where: { kelas, aktif: true },
      order: [['nama', 'ASC']],
      attributes: ['id', 'nama', 'nisn'],
    });

    // Buat baris template — siswa sudah terisi, nilai kosong (0)
    const data = siswaList.map((s, i) => ({
      'No':            i + 1,
      'Nama':          s.nama,
      'NISN':          s.nisn || '',
      'Mata Pelajaran': '',       // harus diisi user
      'UH':            0,
      'PTS':           0,
      'PAS':           0,
      'Praktek':       0,
      'Proyek':        0,
      'Portofolio':    0,
    }));

    // Jika kelas kosong, tetap buat template header saja dengan 1 baris contoh
    if (!data.length) {
      data.push({
        'No': 1, 'Nama': 'Contoh Siswa', 'NISN': '0012345678',
        'Mata Pelajaran': 'Nama Mapel', 'UH': 80, 'PTS': 75, 'PAS': 85,
        'Praktek': 80, 'Proyek': 75, 'Portofolio': 80,
      });
    }

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set lebar kolom
    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
      { wch: 6 }, { wch: 6 }, { wch: 6 },
      { wch: 8 }, { wch: 8 }, { wch: 10 },
    ];

    // Tambahkan sheet petunjuk
    const petunjuk = [
      { Petunjuk: '=== PETUNJUK PENGISIAN TEMPLATE NILAI ===' },
      { Petunjuk: '' },
      { Petunjuk: '1. Kolom "No", "Nama", "NISN" — jangan diubah, digunakan untuk pencocokan data siswa.' },
      { Petunjuk: '2. Kolom "Mata Pelajaran" — isi nama mata pelajaran (harus sama untuk semua baris).' },
      { Petunjuk: '3. Kolom UH, PTS, PAS — nilai pengetahuan (0-100).' },
      { Petunjuk: '4. Kolom Praktek, Proyek, Portofolio — nilai keterampilan (0-100).' },
      { Petunjuk: '5. NA Pengetahuan, NA Keterampilan, NA Akhir, Predikat dihitung otomatis saat import.' },
      { Petunjuk: '6. Simpan file tetap dalam format .xlsx atau .xls sebelum diupload.' },
      { Petunjuk: '' },
      { Petunjuk: `Kelas        : ${kelas}` },
      { Petunjuk: `Semester     : ${semester}` },
      { Petunjuk: `Tahun Ajaran : ${tahunAjaran}` },
    ];
    const wsPetunjuk = XLSX.utils.json_to_sheet(petunjuk);
    wsPetunjuk['!cols'] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const safeKelas = (kelas || 'kelas').replace(/[\s\/\\]/g, '_');
    res.setHeader('Content-Disposition',
      `attachment; filename="template_nilai_${safeKelas}_${semester}.xlsx"`);
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('[downloadTemplate] Error:', err.message);
    return fail(res, 'Gagal membuat template nilai.', 500);
  }
};

// POST /api/nilai/import  (multipart: file + body kelas, semester, tahunAjaran)
exports.importNilai = async (req, res) => {
  const filePath = req.file?.path;
  try {
    const { kelas, semester, tahunAjaran } = req.body;
    if (!kelas || !semester || !tahunAjaran)
      return fail(res, 'kelas, semester, dan tahunAjaran wajib diisi.', 400);
    if (!req.file)
      return fail(res, 'File Excel wajib diupload.', 400);

    // 1. Baca file Excel
    const XLSX = require('xlsx');
    const wb   = XLSX.readFile(filePath);
    // Ambil sheet pertama (sheet "Nilai")
    const sheetName = wb.SheetNames.includes('Nilai') ? 'Nilai' : wb.SheetNames[0];
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) return fail(res, 'File Excel kosong atau tidak bisa dibaca.', 400);

    // 2. Ambil semua siswa kelas ini untuk lookup NISN → siswaId
    const siswaList = await Siswa.findAll({
      where: { kelas },
      attributes: ['id', 'nama', 'nisn'],
    });
    const byNisn = {};
    const byNama = {};
    siswaList.forEach(s => {
      if (s.nisn) byNisn[String(s.nisn).trim()] = s;
      byNama[s.nama.trim().toLowerCase()] = s;
    });

    // 3. Parse baris
    const berhasil  = [];
    const gagal     = [];
    const processed = new Set(); // cegah duplikat per baris

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // nomor baris di Excel (header baris 1)

      const nisn = String(row['NISN'] || '').trim();
      const nama = String(row['Nama'] || '').trim();
      const mapel = String(row['Mata Pelajaran'] || '').trim();

      if (!nama && !nisn) continue; // baris kosong, skip

      if (!mapel) {
        gagal.push({ baris: rowNum, nama: nama || nisn, alasan: 'Kolom "Mata Pelajaran" kosong' });
        continue;
      }

      // Cari siswa: prioritas NISN, fallback nama
      let siswa = null;
      if (nisn)  siswa = byNisn[nisn];
      if (!siswa) siswa = byNama[nama.toLowerCase()];

      if (!siswa) {
        gagal.push({ baris: rowNum, nama: nama || nisn, alasan: 'Siswa tidak ditemukan di kelas ini' });
        continue;
      }

      const key = `${siswa.id}-${mapel}`;
      if (processed.has(key)) {
        gagal.push({ baris: rowNum, nama: siswa.nama, alasan: 'Data duplikat di file (mapel sama)' });
        continue;
      }
      processed.add(key);

      // Ambil nilai, clamp 0-100
      const clamp = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));
      const rowData = {
        siswaId:       siswa.id,
        guruId:        req.guru.id,
        guru:          req.guru.nama,
        kelas,
        semester,
        tahunAjaran,
        mataPelajaran: mapel,
        uh:            clamp(row['UH']),
        pts:           clamp(row['PTS']),
        pas:           clamp(row['PAS']),
        praktek:       clamp(row['Praktek']),
        proyek:        clamp(row['Proyek']),
        portofolio:    clamp(row['Portofolio']),
      };

      // Hitung nilai akhir
      const computed = hitungNilaiRow(rowData);
      berhasil.push({ ...computed, _nama: siswa.nama });
    }

    if (!berhasil.length) {
      return fail(res, `Tidak ada data valid yang bisa diimport. ${gagal.length} baris gagal.`, 400,
        { gagal });
    }

    // 4. Bulk upsert
    const insertRows = berhasil.map(({ _nama, ...r }) => r);
    const upsertFields = [
      'uh','pts','pas','praktek','proyek','portofolio',
      'naPengetahuan','naKeterampilan','naAkhir','predikat',
      'guru','updatedAt',
    ];
    await Nilai.bulkCreate(insertRows, { updateOnDuplicate: upsertFields });

    // 5. Hapus file upload setelah selesai
    try { fs.unlinkSync(filePath); } catch (_) {}

    return ok(res, {
      total:   berhasil.length + gagal.length,
      berhasil: berhasil.length,
      gagal:    gagal.length,
      errorRows: gagal,
      preview:   berhasil.slice(0, 5).map(r => ({
        nama: r._nama || '-', mapel: r.mataPelajaran,
        uh: r.uh, pts: r.pts, pas: r.pas,
        praktek: r.praktek, proyek: r.proyek, portofolio: r.portofolio,
        naAkhir: r.naAkhir, predikat: r.predikat,
      })),
    }, `Import selesai: ${berhasil.length} berhasil, ${gagal.length} gagal.`);
  } catch (err) {
    console.error('[importNilai] Error:', err.message, err.stack);
    // Hapus file jika ada error
    if (filePath) try { fs.unlinkSync(filePath); } catch (_) {}
    return fail(res, 'Gagal mengimport nilai: ' + err.message, 500);
  }
};
