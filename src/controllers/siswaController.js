'use strict';

const { Siswa, Kelas, Nilai, Absensi, Sikap, sequelize } = require('../models/index');
const { ok, fail, paginate } = require('../utils/response');
const { writeExcel, writeExcelMultiSheet, readExcel } = require('../utils/excel');
const { Op } = require('sequelize');
const fs = require('fs');

// ─── Helper build where ──────────────────────────────────────────────────────
function buildWhere(query, guruId = null, role = 'guru') {
  const where = {};
  if (role !== 'admin' && guruId) {
    // Guru bisa lihat semua siswa (global + per-kelas)
  }
  if (query.kelasId) where.kelasId = query.kelasId;
  if (query.kelas)   where.kelas   = query.kelas;
  if (query.status)  where.status  = query.status;
  if (query.search) {
    where[Op.or] = [
      { nama:  { [Op.like]: `%${query.search}%` } },
      { nisn:  { [Op.like]: `%${query.search}%` } },
      { nis:   { [Op.like]: `%${query.search}%` } },
    ];
  }
  return where;
}

// GET /api/siswa  atau  GET /api/admin/siswa
exports.list = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || 1, 10);
    const limit = parseInt(req.query.limit || 50, 10);
    const where = buildWhere(req.query, req.guru.id, req.guru.role);

    const { count, rows } = await Siswa.findAndCountAll({
      where,
      include: [{ model: Kelas, as: 'kelas', attributes: ['id','nama','tingkat','jurusan'], required: false }],
      order:   [['nama', 'ASC']],
      limit,
      offset:  (page - 1) * limit,
    });
    return paginate(res, rows, count, page, limit);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal mengambil data siswa.', 500);
  }
};

// GET /api/siswa/:id
exports.getById = async (req, res) => {
  try {
    const siswa = await Siswa.findByPk(req.params.id, {
      include: [{ model: Kelas, as: 'kelas', attributes: ['id','nama'], required: false }],
    });
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);
    const s = siswa.toJSON();
    s.umur  = siswa.umur; // virtual getter
    return ok(res, s);
  } catch (err) {
    return fail(res, 'Gagal mengambil data siswa.', 500);
  }
};

// POST /api/admin/siswa
exports.create = async (req, res) => {
  try {
    const { nama, nisn, jenisKelamin, kelasId } = req.body;
    if (!nama || !nisn || !jenisKelamin)
      return fail(res, 'Nama, NISN, dan jenis kelamin wajib diisi.', 400);

    const existing = await Siswa.findOne({ where: { nisn: nisn.trim() } });
    if (existing) return fail(res, 'NISN sudah terdaftar.', 409);

    // Ambil nama kelas dari kelasId
    let kelasNama = req.body.kelas || null;
    if (kelasId && !kelasNama) {
      const kelasRow = await Kelas.findByPk(kelasId, { attributes: ['nama'] });
      kelasNama = kelasRow?.nama || null;
    }

    const siswa = await Siswa.create({ ...req.body, kelas: kelasNama, guruId: null });
    return ok(res, siswa, 'Siswa berhasil ditambahkan.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menambahkan siswa.', 500);
  }
};

// PUT /api/admin/siswa/:id  atau  PUT /api/siswa/:id
exports.update = async (req, res) => {
  try {
    const siswa = await Siswa.findByPk(req.params.id);
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    const updateData = { ...req.body };

    // Cek NISN duplikat jika berubah
    if (updateData.nisn && updateData.nisn !== siswa.nisn) {
      const dup = await Siswa.findOne({ where: { nisn: updateData.nisn, id: { [Op.ne]: siswa.id } } });
      if (dup) return fail(res, 'NISN sudah digunakan siswa lain.', 409);
    }

    // Sync kelas string dari kelasId jika kelasId berubah
    if (updateData.kelasId && updateData.kelasId !== siswa.kelasId) {
      const kelasRow = await Kelas.findByPk(updateData.kelasId, { attributes: ['nama'] });
      updateData.kelas = kelasRow?.nama || siswa.kelas;
    }

    // Guru biasa tidak boleh ubah kelasId/guruId
    if (req.guru.role !== 'admin') {
      delete updateData.kelasId;
      delete updateData.guruId;
    }

    await siswa.update(updateData);
    return ok(res, siswa, 'Data siswa berhasil diperbarui.');
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal memperbarui data siswa.', 500);
  }
};

// DELETE /api/admin/siswa/:id
exports.destroy = async (req, res) => {
  try {
    const siswa = await Siswa.findByPk(req.params.id);
    if (!siswa) return fail(res, 'Siswa tidak ditemukan.', 404);

    if (!req.query.force) {
      const hasData = await Nilai.findOne({ where: { siswaId: siswa.id } });
      if (hasData)
        return fail(res, 'Siswa memiliki data nilai. Gunakan ?force=true untuk menghapus beserta data.', 400);
    }
    await siswa.destroy();
    return ok(res, null, 'Siswa berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus siswa.', 500);
  }
};

// POST /api/admin/siswa/bulk-delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return fail(res, 'Tidak ada ID.', 400);
    const deleted = await Siswa.destroy({ where: { id: ids } });
    return ok(res, null, `${deleted} siswa berhasil dihapus.`);
  } catch (err) {
    return fail(res, 'Gagal menghapus siswa.', 500);
  }
};

// POST /api/admin/siswa/import
exports.importSiswa = async (req, res) => {
  try {
    if (!req.file) return fail(res, 'File tidak ditemukan.', 400);
    const rows = readExcel(req.file.path);
    fs.unlink(req.file.path, () => {});

    let created = 0, skipped = 0, errors = [];
    for (const row of rows) {
      const nisn = String(row.nisn || row.NISN || '').trim();
      const nama = String(row.nama || row.Nama || '').trim();
      const jenisKelamin = String(row.jenis_kelamin || row.jenisKelamin || row['Jenis Kelamin'] || '').trim().toUpperCase();

      if (!nisn || !nama || !jenisKelamin) { skipped++; continue; }

      const exists = await Siswa.findOne({ where: { nisn } });
      if (exists) { skipped++; continue; }

      try {
        const kelasList = await Kelas.findOne({ where: { nama: String(row.kelas || row.Kelas || '').trim() } });
        await Siswa.create({
          nisn, nama, jenisKelamin: jenisKelamin === 'L' ? 'L' : 'P',
          nis:          String(row.nis  || row.NIS  || '').trim() || null,
          kelas:        String(row.kelas|| row.Kelas|| '').trim() || null,
          kelasId:      kelasList?.id || null,
          tempatLahir:  String(row.tempat_lahir || row.tempatLahir || '').trim() || null,
          tanggalLahir: row.tanggal_lahir || row.tanggalLahir || null,
          agama:        String(row.agama || '').trim() || null,
          alamat:       String(row.alamat || '').trim() || null,
          namaAyah:     String(row.nama_ayah || row.namaAyah || '').trim() || null,
          namaIbu:      String(row.nama_ibu  || row.namaIbu  || '').trim() || null,
          telpOrtu:     String(row.telp_ortu || row.telpOrtu || '').trim() || null,
          noHp:         String(row.no_hp     || row.noHp     || '').trim() || null,
          tahunMasuk:   parseInt(row.tahun_masuk || row.tahunMasuk || 0) || null,
          penerimaBantuan: String(row.penerima_bantuan || row.penerimaBantuan || 'Tidak').trim() || 'Tidak',
          status:       String(row.status || 'Aktif').trim() || 'Aktif',
          guruId:       null,
        });
        created++;
      } catch (e) {
        errors.push({ nisn, error: e.message });
      }
    }
    return ok(res, { created, skipped, errors }, `Import selesai: ${created} ditambah, ${skipped} dilewati.`);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal mengimpor data siswa.', 500);
  }
};

// GET /api/admin/siswa/export/excel
exports.exportExcel = async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const siswas = await Siswa.findAll({ where, order: [['nama','ASC']], raw: true });
    const data = siswas.map(s => ({
      NISN: s.nisn, NIS: s.nis, Nama: s.nama, Kelas: s.kelas,
      'Jenis Kelamin': s.jenisKelamin, 'Tempat Lahir': s.tempatLahir,
      'Tanggal Lahir': s.tanggalLahir, Agama: s.agama, Alamat: s.alamat,
      'Nama Ayah': s.namaAyah, 'Nama Ibu': s.namaIbu,
      'Telp Ortu': s.telpOrtu, 'No HP': s.noHp,
      'Tahun Masuk': s.tahunMasuk, 'Penerima Bantuan': s.penerimaBantuan,
      Status: s.status,
    }));
    const buffer = writeExcel(data, 'Data Siswa');
    res.setHeader('Content-Disposition', 'attachment; filename="data-siswa.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    return fail(res, 'Gagal mengekspor data siswa.', 500);
  }
};

// GET /api/admin/siswa/kelas-list
exports.kelasList = async (req, res) => {
  try {
    const list = await Kelas.findAll({
      where: { guruId: null },
      attributes: ['id', 'nama', 'tingkat', 'jurusan', 'tahunAjaran'],
      order: [['tingkat','ASC'],['nama','ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar kelas.', 500);
  }
};
