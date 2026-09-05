'use strict';

const { Kelas, Siswa, GuruKelas, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

// ─── Helper: update jumlahSiswa semua kelas ───────────────────────────────────
async function syncJumlahSiswa() {
  const list = await Kelas.findAll({ where: { guruId: null }, attributes: ['id'] });
  for (const k of list) {
    const count = await Siswa.count({ where: { kelasId: k.id, status: 'Aktif' } });
    await k.update({ jumlahSiswa: count });
  }
}

// GET /api/kelas  &  GET /api/admin/kelas
exports.list = async (req, res) => {
  try {
    const where = req.guru.role === 'admin'
      ? { guruId: null }
      : { [Op.or]: [{ guruId: null }, { guruId: req.guru.id }] };

    const { tahunAjaran, tingkat, search } = req.query;
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;
    if (tingkat)     where.tingkat     = parseInt(tingkat, 10);
    if (search)      where.nama        = { [Op.like]: `%${search}%` };

    // Ambil kelas beserta count siswa aktif aktual (bukan dari kolom jumlahSiswa)
    const list = await Kelas.findAll({
      where,
      attributes: {
        include: [
          [
            literal(`(SELECT COUNT(*) FROM siswas WHERE siswas.kelasId = Kelas.id AND siswas.status = 'Aktif')`),
            'jumlahSiswaAktual',
          ],
        ],
      },
      order: [['tingkat','ASC'],['nama','ASC']],
    });

    // Normalisasi — gunakan count aktual
    const data = list.map(k => {
      const plain = k.toJSON();
      plain.jumlahSiswa = parseInt(plain.jumlahSiswaAktual || plain.jumlahSiswa || 0, 10);
      delete plain.jumlahSiswaAktual;
      return plain;
    });

    return ok(res, data);
  } catch (err) {
    console.error('list kelas error:', err.message);
    return fail(res, 'Gagal mengambil data kelas.', 500);
  }
};

// POST /api/admin/kelas/recalculate — update jumlahSiswa semua kelas
exports.recalculate = async (req, res) => {
  try {
    await syncJumlahSiswa();
    return ok(res, null, 'Jumlah siswa per kelas berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui jumlah siswa.', 500);
  }
};

// GET /api/kelas/:id
exports.getById = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return fail(res, 'Kelas tidak ditemukan.', 404);
    return ok(res, kelas);
  } catch (err) {
    return fail(res, 'Gagal mengambil data kelas.', 500);
  }
};

// POST /api/admin/kelas
exports.create = async (req, res) => {
  try {
    const { nama, tingkat, jurusan, rombel, waliKelas, tahunAjaran } = req.body;
    if (!nama || !tingkat || !jurusan || !tahunAjaran)
      return fail(res, 'Nama, tingkat, jurusan, dan tahun ajaran wajib diisi.', 400);

    // Cek duplikat nama+tahunAjaran untuk kelas global
    const dup = await Kelas.findOne({ where: { nama: nama.trim(), tahunAjaran, guruId: null } });
    if (dup) return fail(res, 'Kelas dengan nama dan tahun ajaran yang sama sudah ada.', 409);

    const kelas = await Kelas.create({
      nama: nama.trim(), tingkat, jurusan, rombel: rombel || '1',
      waliKelas: waliKelas || '', tahunAjaran, guruId: null,
    });
    return ok(res, kelas, 'Kelas berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat kelas.', 500);
  }
};

// PUT /api/admin/kelas/:id
exports.update = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return fail(res, 'Kelas tidak ditemukan.', 404);

    const { nama, tingkat, jurusan, rombel, waliKelas, tahunAjaran } = req.body;
    const namaBaru = (nama || kelas.nama).trim();
    const namaLama = kelas.nama;

    await kelas.update({
      nama: namaBaru, tingkat: tingkat || kelas.tingkat,
      jurusan: jurusan || kelas.jurusan, rombel: rombel || kelas.rombel,
      waliKelas: waliKelas ?? kelas.waliKelas,
      tahunAjaran: tahunAjaran || kelas.tahunAjaran,
    });

    // Sync denormalized kelas string di tabel Siswa jika nama berubah
    if (namaBaru !== namaLama) {
      await Siswa.update({ kelas: namaBaru }, { where: { kelasId: kelas.id } });
    }

    return ok(res, kelas, 'Kelas berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui kelas.', 500);
  }
};

// DELETE /api/admin/kelas/:id
exports.destroy = async (req, res) => {
  try {
    const kelas = await Kelas.findByPk(req.params.id);
    if (!kelas) return fail(res, 'Kelas tidak ditemukan.', 404);

    const siswaCount = await Siswa.count({ where: { kelasId: kelas.id } });
    if (siswaCount > 0 && !req.query.force)
      return fail(res, `Kelas masih memiliki ${siswaCount} siswa. Gunakan ?force=true untuk memaksa.`, 400);

    await kelas.destroy();
    return ok(res, null, 'Kelas berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus kelas.', 500);
  }
};

// POST /api/admin/kelas/bulk-delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return fail(res, 'Tidak ada ID yang dikirim.', 400);

    const siswaCount = await Siswa.count({ where: { kelasId: ids } });
    if (siswaCount > 0)
      return fail(res, `${siswaCount} siswa masih terdaftar di kelas yang dipilih.`, 400);

    const deleted = await Kelas.destroy({ where: { id: ids } });
    return ok(res, null, `${deleted} kelas berhasil dihapus.`);
  } catch (err) {
    return fail(res, 'Gagal menghapus kelas.', 500);
  }
};
