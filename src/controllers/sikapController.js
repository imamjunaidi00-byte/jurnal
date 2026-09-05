'use strict';

const { Sikap, Siswa } = require('../models/index');
const { ok, fail }     = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const where = { guruId: req.guru.id };
    if (req.query.kelas)       where.kelas       = req.query.kelas;
    if (req.query.semester)    where.semester    = req.query.semester;
    if (req.query.tahunAjaran) where.tahunAjaran = req.query.tahunAjaran;

    const list = await Sikap.findAll({
      where,
      include: [{ model: Siswa, as: 'siswaRef', attributes: ['id','nama','nisn'] }],
      order:   [[{ model: Siswa, as: 'siswaRef' }, 'nama', 'ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil data sikap.', 500);
  }
};

exports.save = async (req, res) => {
  try {
    const { siswaId, kelas, semester, tahunAjaran } = req.body;
    if (!siswaId || !kelas || !semester || !tahunAjaran)
      return fail(res, 'Data tidak lengkap.', 400);

    const [sikap, created] = await Sikap.upsert(
      { ...req.body, guruId: req.guru.id },
      { returning: true }
    );
    return ok(res, sikap, created ? 'Sikap berhasil ditambahkan.' : 'Sikap berhasil diperbarui.', created ? 201 : 200);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menyimpan sikap.', 500);
  }
};

exports.bulkSave = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return fail(res, 'items wajib diisi.', 400);

    const rows = items.map(item => {
      const row = { ...item, guruId: req.guru.id };
      // Normalisasi: frontend bisa kirim 'siswa' atau 'siswaId'
      if (row.siswa && !row.siswaId) { row.siswaId = row.siswa; delete row.siswa; }
      return row;
    });
    const fields = ['berdoa','toleransi','bersyukur','jujur','disiplin',
                    'tanggungJawab','santun','peduli','percayaDiri',
                    'nilaiSpiritual','nilaiSosial','deskripsiSpiritual','deskripsiSosial',
                    'kelas','updatedAt'];
    await Sikap.bulkCreate(rows, { updateOnDuplicate: fields });
    return ok(res, null, `${rows.length} data sikap berhasil disimpan.`);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menyimpan sikap bulk.', 500);
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { kelas, semester, tahunAjaran } = req.body;
    const deleted = await Sikap.destroy({
      where: { guruId: req.guru.id, kelas, semester, tahunAjaran },
    });
    return ok(res, null, `${deleted} data sikap berhasil dihapus.`);
  } catch (err) {
    return fail(res, 'Gagal menghapus sikap.', 500);
  }
};
