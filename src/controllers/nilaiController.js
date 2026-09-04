'use strict';

const { Nilai, Siswa, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { writeExcel } = require('../utils/excel');
const { Op, fn, col } = require('sequelize');

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

    const rows = items.map(item => ({
      ...item,
      guruId: req.guru.id,
      guru:   item.guru || req.guru.nama,
    }));

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
