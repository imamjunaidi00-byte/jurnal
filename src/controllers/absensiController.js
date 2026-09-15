'use strict';

const { Absensi, AbsensiHarian, Siswa, sequelize } = require('../models/index');
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
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'] }],
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
    const { kelas, semester, tahunAjaran, bulan, tahun, tanggal } = req.query;
    if (!kelas || !semester || !tahunAjaran)
      return fail(res, 'kelas, semester, dan tahunAjaran wajib diisi.', 400);

    const where = { guruId: req.guru.id, kelas, semester, tahunAjaran };

    // Filter opsional berdasarkan tanggal, bulan, atau tahun
    if (tanggal) {
      where.tanggal = tanggal;
    } else if (bulan && tahun) {
      const y = parseInt(tahun, 10);
      const m = parseInt(bulan, 10);
      const firstDay = `${y}-${String(m).padStart(2,'0')}-01`;
      const lastDay  = new Date(y, m, 0);
      const lastDayStr = `${y}-${String(m).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`;
      where.tanggal = { [Op.between]: [firstDay, lastDayStr] };
    } else if (tahun) {
      const y = parseInt(tahun, 10);
      where.tanggal = { [Op.between]: [`${y}-01-01`, `${y}-12-31`] };
    }

    const results = await Absensi.findAll({
      where,
      attributes: [
        'siswaId',
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'hadir' THEN 1 ELSE 0 END")),       'hadir'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'sakit' THEN 1 ELSE 0 END")),       'sakit'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'izin' THEN 1 ELSE 0 END")),        'izin'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'alpha' THEN 1 ELSE 0 END")),       'alpha'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'dispensasi' THEN 1 ELSE 0 END")),  'dispensasi'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'pulang_cepat' THEN 1 ELSE 0 END")),'pulang_cepat'],
        [fn('COUNT', col('`Absensi`.`id`')),                                                    'total'],
      ],
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'] }],
      group:   [literal('`Absensi`.`siswaId`'), literal('`siswaRef`.`id`')],
      order:   [[{ model: Siswa, as: 'siswaRef' }, 'nama', 'ASC']],
    });
    return ok(res, results);
  } catch (err) {
    console.error('[rekap] Error:', err.message);
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
    const { kelas, semester, tahunAjaran, bulan, tahun, tanggal } = req.query;

    if (!kelas) return fail(res, 'Parameter kelas wajib diisi.', 400);

    // Build where clause
    const where = { guruId: req.guru.id };
    if (kelas)       where.kelas       = kelas;
    if (semester)    where.semester    = semester;
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;

    // Filter berdasarkan tanggal spesifik, bulan, atau tahun
    if (tanggal) {
      where.tanggal = tanggal;
    } else if (bulan && tahun) {
      const y = parseInt(tahun, 10);
      const m = parseInt(bulan, 10);
      const firstDay = `${y}-${String(m).padStart(2,'0')}-01`;
      const lastDay  = new Date(y, m, 0); // hari terakhir bulan
      const lastDayStr = `${y}-${String(m).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`;
      where.tanggal = { [Op.between]: [firstDay, lastDayStr] };
    } else if (tahun) {
      const y = parseInt(tahun, 10);
      where.tanggal = { [Op.between]: [`${y}-01-01`, `${y}-12-31`] };
    }

    const results = await Absensi.findAll({
      where,
      attributes: [
        'siswaId',
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'hadir' THEN 1 ELSE 0 END")),      'Hadir'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'sakit' THEN 1 ELSE 0 END")),      'Sakit'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'izin' THEN 1 ELSE 0 END")),       'Izin'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'alpha' THEN 1 ELSE 0 END")),      'Alpha'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'dispensasi' THEN 1 ELSE 0 END")), 'Dispensasi'],
        [fn('SUM', literal("CASE WHEN `Absensi`.`status` = 'pulang_cepat' THEN 1 ELSE 0 END")), 'PulangCepat'],
        [fn('COUNT', col('`Absensi`.`id`')),                                                   'Total'],
      ],
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['nama','nisn'] }],
      group:   [literal('`Absensi`.`siswaId`'), literal('`siswaRef`.`id`')],
      order:   [[{ model: Siswa, as: 'siswaRef' }, 'nama', 'ASC']],
      raw:     true,
      nest:    true,
    });

    // Buat label periode untuk nama file dan header
    let periodeLabel = tahunAjaran || 'semua';
    if (tanggal) {
      periodeLabel = tanggal;
    } else if (bulan && tahun) {
      const bulanNames = ['','Januari','Februari','Maret','April','Mei','Juni',
                          'Juli','Agustus','September','Oktober','November','Desember'];
      periodeLabel = `${bulanNames[parseInt(bulan,10)] || bulan}_${tahun}`;
    } else if (tahun) {
      periodeLabel = tahun;
    }

    const data = results.map((r, i) => ({
      No:          i + 1,
      Nama:        r.siswaRef?.nama || '-',
      NISN:        r.siswaRef?.nisn || '-',
      Hadir:       Number(r.Hadir)       || 0,
      Sakit:       Number(r.Sakit)       || 0,
      Izin:        Number(r.Izin)        || 0,
      Alpha:       Number(r.Alpha)       || 0,
      Dispensasi:  Number(r.Dispensasi)  || 0,
      'Pulang Cepat': Number(r.PulangCepat) || 0,
      Total:       Number(r.Total)       || 0,
    }));

    if (!data.length) {
      return fail(res, 'Tidak ada data absensi untuk filter yang dipilih.', 404);
    }

    const safeKelas = (kelas || 'kelas').replace(/[\s\/\\]/g, '_');
    const buffer = writeExcel(data, 'Rekap Absensi');
    res.setHeader('Content-Disposition',
      `attachment; filename="rekap-absensi-${safeKelas}-${periodeLabel}.xlsx"`);
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('[downloadRekap] Error:', err.message, err.stack);
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

// GET /api/absensi/rekap-gabungan
// Menggabungkan AbsensiHarian (prioritas) + Absensi mapel
// Response: array of { id, siswaId, siswa: {id,nama,nisn}, kelas, tanggal, status, ... }
exports.rekapGabungan = async (req, res) => {
  try {
    const { kelas, tanggal, tanggalMulai, tanggalAkhir } = req.query;
    if (!kelas) return fail(res, 'Parameter kelas wajib diisi.', 400);

    const guruId = req.guru.id;

    // Build filter tanggal
    const buildWhereTanggal = (alias) => {
      const w = { guruId, kelas };
      if (tanggal) {
        w.tanggal = tanggal;
      } else if (tanggalMulai && tanggalAkhir) {
        w.tanggal = { [Op.between]: [tanggalMulai, tanggalAkhir] };
      }
      return w;
    };

    // Ambil AbsensiHarian dan Absensi paralel
    const [harian, mapel] = await Promise.all([
      AbsensiHarian.findAll({
        where: buildWhereTanggal(),
        include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'], required: false }],
        order: [['tanggal','ASC']],
      }),
      Absensi.findAll({
        where: buildWhereTanggal(),
        include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'], required: false }],
        order: [['tanggal','ASC']],
      }),
    ]);

    // Buat map dari AbsensiHarian: key = `${siswaId}-${tanggal}`
    // AbsensiHarian punya prioritas lebih tinggi
    const harianMap = new Map();
    harian.forEach(h => {
      const key = `${h.siswaId}-${h.tanggal}`;
      harianMap.set(key, {
        id:       h.id,
        siswaId:  h.siswaId,
        siswa:    h.siswaRef || { id: h.siswaId, nama: '-', nisn: '-' },
        kelas:    h.kelas,
        tanggal:  h.tanggal,
        status:   h.status,
        keterangan: h.keterangan || '',
        sumber:   'harian',
      });
    });

    // Gabungkan dengan absensi mapel — hanya tambahkan jika belum ada di harian
    const result = [...harianMap.values()];

    mapel.forEach(a => {
      const key = `${a.siswaId}-${a.tanggal}`;
      if (!harianMap.has(key)) {
        result.push({
          id:       a.id,
          siswaId:  a.siswaId,
          siswa:    a.siswaRef || { id: a.siswaId, nama: '-', nisn: '-' },
          kelas:    a.kelas,
          tanggal:  a.tanggal,
          status:   a.status,
          keterangan:   a.keterangan || '',
          mataPelajaran: a.mataPelajaran,
          sumber:   'mapel',
        });
      }
    });

    // Sort by tanggal, lalu nama siswa
    result.sort((a, b) => {
      const tDiff = String(a.tanggal).localeCompare(String(b.tanggal));
      if (tDiff !== 0) return tDiff;
      return (a.siswa?.nama || '').localeCompare(b.siswa?.nama || '');
    });

    return ok(res, result);
  } catch (err) {
    console.error('rekapGabungan error:', err.message);
    return fail(res, 'Gagal mengambil rekap absensi gabungan.', 500);
  }
};
