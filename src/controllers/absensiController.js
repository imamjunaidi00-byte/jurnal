'use strict';

const { Absensi, Siswa, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { writeExcel } = require('../utils/excel');
const { Op, fn, col, literal } = require('sequelize');

function buildWhere(query, guruId) {
  const where = { guruId };
  if (query.kelas)        where.kelas        = query.kelas;
  if (query.semester)     where.semester     = query.semester;
  if (query.tahunAjaran)  where.tahunAjaran  = query.tahunAjaran;
  if (query.tanggal)      where.tanggal      = query.tanggal;
  if (query.mataPelajaran)where.mataPelajaran= query.mataPelajaran;
  if (query.siswaId)      where.siswaId      = query.siswaId;
  return where;
}

exports.list = async (req, res) => {
  try {
    const where = buildWhere(req.query, req.guru.id);
    const list  = await Absensi.findAll({
      where,
      include: [{ model: Siswa, as: 'siswa', attributes: ['id','nama','nisn'] }],
      order:   [['tanggal','DESC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil data absensi.', 500);
  }
};

// POST /api/absensi/bulk — simpan sekaligus untuk satu tanggal/kelas/mapel
exports.bulkSave = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { kelas, tanggal, semester, tahunAjaran, mataPelajaran, guruPengampu, items } = req.body;
    if (!kelas || !tanggal || !semester || !tahunAjaran || !mataPelajaran || !Array.isArray(items))
      return fail(res, 'Data tidak lengkap.', 400);

    // Hapus dulu data lama untuk sesi ini
    await Absensi.destroy({
      where: { guruId: req.guru.id, kelas, tanggal, mataPelajaran },
      transaction: t,
    });

    const rows = items.map(item => ({
      guruId: req.guru.id, siswaId: item.siswaId,
      kelas, tanggal, semester, tahunAjaran, mataPelajaran,
      guruPengampu: guruPengampu || req.guru.nama,
      status:      item.status || 'hadir',
      keterangan:  item.keterangan || '',
      jamMasuk:    item.jamMasuk  || null,
      jamPulang:   item.jamPulang || null,
    }));

    const saved = await Absensi.bulkCreate(rows, { transaction: t });
    await t.commit();
    return ok(res, saved, `${saved.length} data absensi berhasil disimpan.`, 201);
  } catch (err) {
    await t.rollback();
    console.error(err);
    return fail(res, 'Gagal menyimpan absensi.', 500);
  }
};

// GET /api/absensi/rekap
exports.rekap = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    if (!kelas || !semester || !tahunAjaran)
      return fail(res, 'kelas, semester, dan tahunAjaran wajib diisi.', 400);

    const results = await Absensi.findAll({
      where: { guruId: req.guru.id, kelas, semester, tahunAjaran },
      attributes: [
        'siswaId',
        [fn('SUM', literal("status = 'hadir'")),      'hadir'],
        [fn('SUM', literal("status = 'sakit'")),      'sakit'],
        [fn('SUM', literal("status = 'izin'")),       'izin'],
        [fn('SUM', literal("status = 'alpha'")),      'alpha'],
        [fn('SUM', literal("status = 'dispensasi'")), 'dispensasi'],
        [fn('SUM', literal("status = 'pulang_cepat'")),'pulang_cepat'],
        [fn('COUNT', col('id')),                      'total'],
      ],
      include: [{ model: Siswa, as: 'siswa', attributes: ['id','nama','nisn'] }],
      group:   ['siswaId'],
      order:   [[{ model: Siswa, as: 'siswa' }, 'nama', 'ASC']],
    });
    return ok(res, results);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal mengambil rekap absensi.', 500);
  }
};

// GET /api/absensi/summary
exports.summary = async (req, res) => {
  try {
    const { kelas, tanggal } = req.query;
    if (!kelas || !tanggal) return fail(res, 'kelas dan tanggal wajib diisi.', 400);

    const counts = await Absensi.findAll({
      where: { guruId: req.guru.id, kelas, tanggal },
      attributes: ['status', [fn('COUNT', col('id')), 'jumlah']],
      group: ['status'],
    });
    return ok(res, counts);
  } catch (err) {
    return fail(res, 'Gagal mengambil summary absensi.', 500);
  }
};

// GET /api/absensi/rekap/download
exports.downloadRekap = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    const results = await Absensi.findAll({
      where: { guruId: req.guru.id, kelas, semester, tahunAjaran },
      attributes: [
        'siswaId',
        [fn('SUM', literal("status = 'hadir'")),      'Hadir'],
        [fn('SUM', literal("status = 'sakit'")),      'Sakit'],
        [fn('SUM', literal("status = 'izin'")),       'Izin'],
        [fn('SUM', literal("status = 'alpha'")),      'Alpha'],
        [fn('SUM', literal("status = 'dispensasi'")), 'Dispensasi'],
        [fn('COUNT', col('id')),                      'Total'],
      ],
      include: [{ model: Siswa, as: 'siswa', attributes: ['nama','nisn'] }],
      group:   ['siswaId'],
      order:   [[{ model: Siswa, as: 'siswa' }, 'nama', 'ASC']],
      raw:     true,
      nest:    true,
    });

    const data = results.map(r => ({
      Nama:       r.siswa.nama, NISN: r.siswa.nisn,
      Hadir: r.Hadir, Sakit: r.Sakit, Izin: r.Izin,
      Alpha: r.Alpha, Dispensasi: r.Dispensasi, Total: r.Total,
    }));
    const buffer = writeExcel(data, 'Rekap Absensi');
    res.setHeader('Content-Disposition', `attachment; filename="rekap-absensi-${kelas}-${semester}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    return fail(res, 'Gagal mengunduh rekap absensi.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const abs = await Absensi.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!abs) return fail(res, 'Data absensi tidak ditemukan.', 404);
    await abs.update(req.body);
    return ok(res, abs, 'Absensi berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui absensi.', 500);
  }
};

exports.destroy = async (req, res) => {
  try {
    const abs = await Absensi.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!abs) return fail(res, 'Data absensi tidak ditemukan.', 404);
    await abs.destroy();
    return ok(res, null, 'Absensi berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus absensi.', 500);
  }
};
