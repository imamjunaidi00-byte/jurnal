'use strict';

const { Guru, Kelas, Siswa, Absensi, AbsensiHarian, Nilai, Sikap, Jurnal, Jadwal,
        MindMap, MappingMapel, GuruKelas, PengabsenKelas, Profil, Config, LoginLog,
        AppSetting, sequelize } = require('../models/index');
const { ok, fail } = require('../utils/response');
const { invalidateGuruTokens } = require('../middleware/auth');
const { writeExcel, readExcel } = require('../utils/excel');
const { Op } = require('sequelize');
const cache = require('../utils/cache');

// ─── GET /api/admin/guru ─────────────────────────────────────────────────────
exports.listGuru = async (req, res) => {
  try {
    // Hanya tampilkan role 'guru', bukan admin
    const gurus = await Guru.findAll({
      where: { role: 'guru' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    return ok(res, gurus);
  } catch (err) {
    return fail(res, 'Gagal mengambil data guru.', 500);
  }
};

// ─── POST /api/admin/guru ────────────────────────────────────────────────────
exports.createGuru = async (req, res) => {
  try {
    const { username, password, nama, role = 'guru' } = req.body;
    if (!username || !password || !nama)
      return fail(res, 'Username, password, dan nama wajib diisi.', 400);
    if (password.length < 6)
      return fail(res, 'Password minimal 6 karakter.', 400);

    const exists = await Guru.findOne({ where: { username: username.toLowerCase().trim() } });
    if (exists) return fail(res, 'Username sudah digunakan.', 409);

    const guru = await Guru.create({ username, password, nama, role });
    return ok(res, guru.toJSON(), 'Akun guru berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat akun guru.', 500);
  }
};

// ─── PUT /api/admin/guru/:id/edit ───────────────────────────────────────────
exports.editGuru = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return fail(res, 'Guru tidak ditemukan.', 404);

    const { nama, username, password } = req.body;
    if (nama)     guru.nama = nama;
    if (username) {
      const uname = username.toLowerCase().trim();
      const dup = await Guru.findOne({ where: { username: uname, id: { [Op.ne]: guru.id } } });
      if (dup) return fail(res, 'Username sudah digunakan.', 409);
      guru.username = uname;
    }
    if (password) {
      if (password.length < 6) return fail(res, 'Password minimal 6 karakter.', 400);
      guru.password = password;
    }
    await guru.save();
    invalidateGuruTokens(guru.id);

    return ok(res, guru.toJSON(), 'Data guru berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui data guru.', 500);
  }
};

// ─── PUT /api/admin/guru/:id/reset-password ──────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return fail(res, 'Guru tidak ditemukan.', 404);

    const newPass = req.body.password || 'Password@123';
    if (newPass.length < 6) return fail(res, 'Password minimal 6 karakter.', 400);

    guru.password = newPass;
    await guru.save();
    invalidateGuruTokens(guru.id);

    return ok(res, null, `Password berhasil direset menjadi: ${newPass}`);
  } catch (err) {
    return fail(res, 'Gagal mereset password.', 500);
  }
};

// ─── DELETE /api/admin/guru/:id ──────────────────────────────────────────────
exports.deleteGuru = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return fail(res, 'Guru tidak ditemukan.', 404);
    if (guru.id === req.guru.id) return fail(res, 'Tidak bisa menghapus akun sendiri.', 400);

    invalidateGuruTokens(guru.id);
    await guru.destroy(); // cascade di DB akan hapus semua data terkait

    return ok(res, null, 'Akun guru dan semua data terkait berhasil dihapus.');
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal menghapus akun guru.', 500);
  }
};

// ─── POST /api/admin/guru/bulk-delete ───────────────────────────────────────
exports.bulkDeleteGuru = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return fail(res, 'Tidak ada ID yang dikirim.', 400);
    if (ids.includes(req.guru.id) || ids.includes(String(req.guru.id)))
      return fail(res, 'Tidak bisa menghapus akun sendiri.', 400);

    ids.forEach(id => invalidateGuruTokens(id));
    const deleted = await Guru.destroy({ where: { id: ids } });

    return ok(res, null, `${deleted} akun guru berhasil dihapus.`);
  } catch (err) {
    return fail(res, 'Gagal menghapus akun guru.', 500);
  }
};

// ─── PUT /api/admin/guru/:id/wali-kelas ─────────────────────────────────────
exports.setWaliKelas = async (req, res) => {
  try {
    const guru = await Guru.findByPk(req.params.id);
    if (!guru) return fail(res, 'Guru tidak ditemukan.', 404);

    const { isWaliKelas, kelasWali } = req.body;
    guru.isWaliKelas = isWaliKelas ?? guru.isWaliKelas;
    guru.kelasWali   = kelasWali   ?? guru.kelasWali;
    await guru.save();
    invalidateGuruTokens(guru.id);

    return ok(res, guru.toJSON(), 'Status wali kelas berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui wali kelas.', 500);
  }
};

// ─── GET /api/admin/guru/wali-kelas ─────────────────────────────────────────
exports.listWaliKelas = async (req, res) => {
  try {
    const list = await Guru.findAll({
      where: { isWaliKelas: true },
      attributes: { exclude: ['password'] },
      order: [['nama', 'ASC']],
    });
    return ok(res, list);
  } catch (err) {
    return fail(res, 'Gagal mengambil data wali kelas.', 500);
  }
};

// ─── GET /api/admin/app-identity ─────────────────────────────────────────────
exports.getAppIdentity = async (req, res) => {
  try {
    const cached = cache.get('app-identity');
    if (cached) return ok(res, cached);

    const row = await AppSetting.findOne({ where: { key: 'identity' } });
    const data = row?.value || { name: 'E-Journal SMK', tagline: 'Sistem Jurnal Digital Guru', logo: '' };
    cache.set('app-identity', data, 5 * 60 * 1000);
    return ok(res, data);
  } catch (err) {
    return ok(res, { name: 'E-Journal SMK', tagline: 'Sistem Jurnal Digital Guru', logo: '' });
  }
};

// ─── PUT /api/admin/app-identity ─────────────────────────────────────────────
exports.updateAppIdentity = async (req, res) => {
  try {
    const { name, tagline, logo } = req.body;
    const value = { name: name || '', tagline: tagline || '', logo: logo || '' };

    await AppSetting.upsert({ key: 'identity', value });
    cache.del('app-identity');

    return ok(res, value, 'Identitas aplikasi berhasil diperbarui.');
  } catch (err) {
    return fail(res, 'Gagal memperbarui identitas aplikasi.', 500);
  }
};

// ─── GET /api/admin/aktivitas ────────────────────────────────────────────────
exports.getAktivitas = async (req, res) => {
  try {
    const logs = await LoginLog.findAll({
      include: [{ model: Guru, as: 'guruRef', attributes: ['nama', 'username', 'role'] }],
      order:   [['loginAt', 'DESC']],
      limit:   10,
    });
    return ok(res, logs);
  } catch (err) {
    return fail(res, 'Gagal mengambil aktivitas login.', 500);
  }
};

// ─── GET /api/admin/aktivitas/guru/:id ────────────────────────────────────────
exports.getAktivitasGuru = async (req, res) => {
  try {
    const logs = await LoginLog.findAll({
      where: { guruId: req.params.id },
      order: [['loginAt', 'DESC']],
      limit: 30,
      attributes: ['id', 'loginAt', 'ip', 'userAgent'],
    });
    return ok(res, logs);
  } catch (err) {
    return fail(res, 'Gagal mengambil riwayat login.', 500);
  }
};

// ─── GET /api/admin/aktivitas/stats ──────────────────────────────────────────
exports.getAktivitasStats = async (req, res) => {
  try {
    // Pakai raw query untuk hindari masalah GROUP BY di MariaDB strict mode
    const [results] = await sequelize.query(`
      SELECT
        ll.guruId,
        COUNT(ll.id)     AS totalLogin,
        MAX(ll.loginAt)  AS lastLogin,
        g.nama,
        g.username
      FROM login_logs ll
      LEFT JOIN gurus g ON g.id = ll.guruId
      GROUP BY ll.guruId, g.id, g.nama, g.username
      ORDER BY MAX(ll.loginAt) DESC
    `);
    return ok(res, results);
  } catch (err) {
    console.error('getAktivitasStats error:', err.message);
    return fail(res, 'Gagal mengambil statistik aktivitas.', 500);
  }
};

// ─── POST /api/admin/guru/import-excel ───────────────────────────────────────
exports.importGuruExcel = async (req, res) => {
  try {
    if (!req.file) return fail(res, 'File tidak ditemukan.', 400);
    const rows = readExcel(req.file.path);

    let created = 0, skipped = 0;
    for (const row of rows) {
      const username = String(row.username || row.Username || '').toLowerCase().trim();
      const password = String(row.password || row.Password || 'Password@123');
      const nama     = String(row.nama     || row.Nama     || '').trim();
      const role     = String(row.role     || row.Role     || 'guru').toLowerCase();

      if (!username || !nama) { skipped++; continue; }

      const exists = await Guru.findOne({ where: { username } });
      if (exists) { skipped++; continue; }

      await Guru.create({ username, password, nama, role: ['guru','admin'].includes(role) ? role : 'guru' });
      created++;
    }
    return ok(res, { created, skipped }, `Import selesai: ${created} dibuat, ${skipped} dilewati.`);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal mengimpor data guru.', 500);
  }
};

// ─── GET /api/admin/guru/export-excel ───────────────────────────────────────
exports.exportGuruExcel = async (req, res) => {
  try {
    const gurus = await Guru.findAll({ attributes: { exclude: ['password'] }, raw: true });
    const data  = gurus.map(g => ({
      ID:          g.id,
      Username:    g.username,
      Nama:        g.nama,
      Role:        g.role,
      WaliKelas:   g.isWaliKelas ? 'Ya' : 'Tidak',
      KelasWali:   g.kelasWali,
      Dibuat:      g.createdAt,
    }));
    const buffer = writeExcel(data, 'Data Guru');
    res.setHeader('Content-Disposition', 'attachment; filename="data-guru.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    return fail(res, 'Gagal mengekspor data guru.', 500);
  }
};

// ─── GET /api/admin/admins — daftar semua akun admin ─────────────────────────
exports.listAdmins = async (req, res) => {
  try {
    const admins = await Guru.findAll({
      where: { role: 'admin' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'ASC']],
    });
    return ok(res, admins);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar admin.', 500);
  }
};

// ─── POST /api/admin/admins — buat akun admin baru ───────────────────────────
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, nama } = req.body;
    if (!username || !password || !nama)
      return fail(res, 'Username, password, dan nama wajib diisi.', 400);
    if (password.length < 6)
      return fail(res, 'Password minimal 6 karakter.', 400);

    const exists = await Guru.findOne({ where: { username: username.toLowerCase().trim() } });
    if (exists) return fail(res, 'Username sudah digunakan.', 409);

    const admin = await Guru.create({ username, password, nama, role: 'admin' });
    return ok(res, admin.toJSON(), 'Akun admin berhasil dibuat.', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal membuat akun admin.', 500);
  }
};

// ─── PUT /api/admin/admins/:id/reset-password ────────────────────────────────
exports.resetAdminPassword = async (req, res) => {
  try {
    const admin = await Guru.findOne({ where: { id: req.params.id, role: 'admin' } });
    if (!admin) return fail(res, 'Admin tidak ditemukan.', 404);

    const newPass = req.body.password || 'Password@123';
    if (newPass.length < 6) return fail(res, 'Password minimal 6 karakter.', 400);

    admin.password = newPass;
    await admin.save();
    const { invalidateGuruTokens } = require('../middleware/auth');
    invalidateGuruTokens(admin.id);

    return ok(res, null, `Password admin berhasil direset.`);
  } catch (err) {
    return fail(res, 'Gagal mereset password admin.', 500);
  }
};

// ─── DELETE /api/admin/admins/:id ────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.guru.id))
      return fail(res, 'Tidak bisa menghapus akun sendiri.', 400);

    const admin = await Guru.findOne({ where: { id: req.params.id, role: 'admin' } });
    if (!admin) return fail(res, 'Admin tidak ditemukan.', 404);

    const { invalidateGuruTokens } = require('../middleware/auth');
    invalidateGuruTokens(admin.id);
    await admin.destroy();

    return ok(res, null, 'Akun admin berhasil dihapus.');
  } catch (err) {
    return fail(res, 'Gagal menghapus akun admin.', 500);
  }
};

// ─── GET /api/admin/stats — statistik dashboard ──────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { Siswa, Kelas } = require('../models/index');
    const { Op } = require('sequelize');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalGuru, totalSiswa, totalKelas, guruBaru] = await Promise.all([
      Guru.count({ where: { role: 'guru' } }),
      Siswa.count({ where: { status: 'Aktif' } }),
      Kelas.count({ where: { guruId: null } }),
      Guru.count({ where: { role: 'guru', createdAt: { [Op.gte]: startOfMonth } } }),
    ]);

    return ok(res, { totalGuru, totalSiswa, totalKelas, guruBaru });
  } catch (err) {
    return fail(res, 'Gagal mengambil statistik.', 500);
  }
};

// ─── DELETE /api/admin/guru/sync-reset ────────────────────────────────────────
// Hapus semua akun guru yang bukan admin dan bukan diri sendiri
// Dipakai untuk reset sebelum sync ulang dengan username NIP
exports.resetSyncGuru = async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESET_GURU') {
      return fail(res, 'Kirim { confirm: "RESET_GURU" } untuk konfirmasi.', 400);
    }

    // Hapus semua guru (bukan admin, bukan diri sendiri)
    const deleted = await Guru.destroy({
      where: {
        role: 'guru',
        id:   { [Op.ne]: req.guru.id },
      },
    });

    return ok(res, { deleted }, `${deleted} akun guru berhasil dihapus. Silakan sync ulang.`);
  } catch (err) {
    console.error(err);
    return fail(res, 'Gagal mereset akun guru.', 500);
  }
};
