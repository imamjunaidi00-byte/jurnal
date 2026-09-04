'use strict';

const { PengabsenKelas, AbsensiHarian, Siswa, Profil, sequelize } = require('../models/index');
const { generateToken } = require('../middleware/auth');
const { ok, fail }      = require('../utils/response');
const { writeExcel }    = require('../utils/excel');
const { Op, fn, col, literal } = require('sequelize');

// ─── Pengabsen CRUD ──────────────────────────────────────────────────────────
exports.listPengabsen = async (req, res) => {
  try {
    const list = await PengabsenKelas.findAll({ where: { guruId: req.guru.id }, order: [['nama','ASC']] });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar pengabsen.', 500);
  }
};

exports.createPengabsen = async (req, res) => {
  try {
    const { username, password, nama, kelas } = req.body;
    if (!username || !password || !nama || !kelas)
      return fail(res, 'Username, password, nama, dan kelas wajib diisi.', 400);

    const exists = await PengabsenKelas.findOne({ where: { username: username.toLowerCase().trim() } });
    if (exists) return fail(res, 'Username sudah digunakan.', 409);

    const p = await PengabsenKelas.create({ guruId: req.guru.id, username, password, nama, kelas });
    return ok(res, p, 'Akun pengabsen berhasil dibuat.', 201);
  } catch (err) {
    return fail(res, 'Gagal membuat akun pengabsen.', 500);
  }
};

exports.updatePengabsen = async (req, res) => {
  try {
    const p = await PengabsenKelas.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!p) return fail(res, 'Pengabsen tidak ditemukan.', 404);
    await p.update(req.body);
    return ok(res, p, 'Akun pengabsen berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui pengabsen.', 500);
  }
};

exports.deletePengabsen = async (req, res) => {
  try {
    const p = await PengabsenKelas.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!p) return fail(res, 'Pengabsen tidak ditemukan.', 404);
    await p.destroy();
    return ok(res, null, 'Akun pengabsen berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus pengabsen.', 500);
  }
};

// ─── Absensi Harian (wali kelas view) ───────────────────────────────────────
exports.listAbsensiHarian = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.kelas)       where.kelas       = req.query.kelas;
    if (req.query.tanggal)     where.tanggal     = req.query.tanggal;
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;
    if (req.query.bulan) {
      const [y, m] = req.query.bulan.split('-');
      where.tanggal = { [Op.between]: [`${y}-${m}-01`, `${y}-${m}-31`] };
    }

    const list = await AbsensiHarian.findAll({
      where,
      include: [{ model: Siswa, as: 'siswa', attributes: ['id','nama','nisn'] }],
      order:   [['tanggal','DESC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil absensi harian.', 500);
  }
};

exports.rekapAbsensiHarian = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    if (!kelas || !semester || !tahunAjaran)
      return fail(res, 'kelas, semester, tahunAjaran wajib diisi.', 400);

    const results = await AbsensiHarian.findAll({
      where: { guruId: req.guru.id, kelas, semester, tahunAjaran },
      attributes: [
        'siswaId',
        [fn('SUM', literal("status = 'hadir'")),      'hadir'],
        [fn('SUM', literal("status = 'sakit'")),      'sakit'],
        [fn('SUM', literal("status = 'izin'")),       'izin'],
        [fn('SUM', literal("status = 'alpha'")),      'alpha'],
        [fn('SUM', literal("status = 'dispensasi'")), 'dispensasi'],
        [fn('COUNT', col('id')),                      'total'],
      ],
      include: [{ model: Siswa, as: 'siswa', attributes: ['id','nama','nisn'] }],
      group:   ['siswaId'],
    });
    return ok(res, results);
  } catch (err) {
    return fail(res, 'Gagal mengambil rekap.', 500);
  }
};

exports.updateAbsensiHarian = async (req, res) => {
  try {
    const ah = await AbsensiHarian.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!ah) return fail(res, 'Data tidak ditemukan.', 404);
    await ah.update(req.body);
    return ok(res, ah, 'Absensi harian berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui absensi harian.', 500);
  }
};

exports.deleteAbsensiHarian = async (req, res) => {
  try {
    const ah = await AbsensiHarian.findOne({ where: { id: req.params.id, guruId: req.guru.id } });
    if (!ah) return fail(res, 'Data tidak ditemukan.', 404);
    await ah.destroy();
    return ok(res, null, 'Absensi harian berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus absensi harian.', 500);
  }
};

exports.downloadAbsensiHarian = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.query;
    const results = await AbsensiHarian.findAll({
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
      raw: true, nest: true,
    });
    const data = results.map(r => ({
      Nama: r.siswa.nama, NISN: r.siswa.nisn,
      Hadir: r.Hadir, Sakit: r.Sakit, Izin: r.Izin,
      Alpha: r.Alpha, Dispensasi: r.Dispensasi, Total: r.Total,
    }));
    const buffer = writeExcel(data, 'Rekap Absensi Harian');
    res.setHeader('Content-Disposition', `attachment; filename="rekap-harian-${kelas}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    return fail(res, 'Gagal mengunduh rekap absensi harian.', 500);
  }
};

// ─── Pengabsen Login & Actions ───────────────────────────────────────────────
exports.loginPengabsen = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, 'Username dan password wajib diisi.', 400);

    const p = await PengabsenKelas.findOne({ where: { username: username.toLowerCase().trim() } });
    if (!p)         return fail(res, 'Username atau password salah.', 401);
    if (!p.aktif)   return fail(res, 'Akun tidak aktif.', 403);

    const match = await p.matchPassword(password);
    if (!match) return fail(res, 'Username atau password salah.', 401);

    const token = generateToken({ id: p.id, type: 'pengabsen', guruId: p.guruId }, '7d');
    return ok(res, { token, pengabsen: p.toJSON() }, 'Login berhasil.');
  } catch (err) {
    return fail(res, 'Terjadi kesalahan server.', 500);
  }
};

exports.infoPengabsen = async (req, res) => {
  try {
    const profil = await Profil.findOne({ where: { guruId: req.pengabsen.guruId } });
    return ok(res, {
      pengabsen:   req.pengabsen,
      semester:    profil?.semester    || 'Ganjil',
      tahunAjaran: profil?.tahunAjaran || '',
    });
  } catch (err) {
    return fail(res, 'Gagal mengambil info pengabsen.', 500);
  }
};

exports.siswaPengabsen = async (req, res) => {
  try {
    const list = await Siswa.findAll({
      where: { kelas: req.pengabsen.kelas, status: 'Aktif' },
      order: [['nama','ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar siswa.', 500);
  }
};

exports.absensiHariIni = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const list  = await AbsensiHarian.findAll({
      where: { guruId: req.pengabsen.guruId, kelas: req.pengabsen.kelas, tanggal: today },
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil absensi hari ini.', 500);
  }
};

exports.inputAbsensi = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tanggal, semester, tahunAjaran, items } = req.body;
    if (!tanggal || !semester || !tahunAjaran || !Array.isArray(items))
      return fail(res, 'Data tidak lengkap.', 400);

    await AbsensiHarian.destroy({
      where: { guruId: req.pengabsen.guruId, kelas: req.pengabsen.kelas, tanggal },
      transaction: t,
    });

    const rows = items.map(item => ({
      guruId:      req.pengabsen.guruId,
      siswaId:     item.siswaId,
      pengabsenId: req.pengabsen.id,
      kelas:       req.pengabsen.kelas,
      tanggal, semester, tahunAjaran,
      status:      item.status || 'hadir',
      keterangan:  item.keterangan || '',
      diinputOleh: req.pengabsen.nama,
    }));

    const saved = await AbsensiHarian.bulkCreate(rows, { transaction: t });
    await t.commit();
    return ok(res, saved, `${saved.length} data absensi berhasil disimpan.`, 201);
  } catch (err) {
    await t.rollback();
    console.error(err);
    return fail(res, 'Gagal menyimpan absensi.', 500);
  }
};
