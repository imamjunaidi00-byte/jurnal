'use strict';

const { fullSync, syncOne, testConnection, pullFromSdms } = require('../services/sdmsSyncService');
const { ok, fail } = require('../utils/response');

// Status sync terakhir — in-memory (cukup untuk 1 proses)
let lastSyncResult = null;
let syncInProgress = false;

// ─── GET /api/sync/status ──────────────────────────────────────────────────
exports.getStatus = (req, res) => {
  return ok(res, {
    inProgress: syncInProgress,
    lastSync:   lastSyncResult,
    sdmsUrl:    process.env.SDMS_SYNC_URL || null,
    configured: !!(process.env.SDMS_SYNC_URL && process.env.SDMS_SYNC_SECRET),
  });
};

// ─── GET /api/sync/test ────────────────────────────────────────────────────
exports.testConn = async (req, res) => {
  try {
    const result = await testConnection();
    return ok(res, result, 'Koneksi ke SDMS berhasil.');
  } catch (err) {
    return fail(res, `Tidak bisa terhubung ke SDMS: ${err.message}`, 503);
  }
};

// ─── GET /api/sync/preview ─────────────────────────────────────────────────
// Ambil data dari SDMS tapi JANGAN simpan — hanya preview jumlah data
exports.preview = async (req, res) => {
  try {
    const data = await pullFromSdms();
    return ok(res, {
      kelas: data.kelas?.length  || 0,
      siswa: data.siswa?.length  || 0,
      guru:  data.guru?.length   || 0,
      mapel: data.mapel?.length  || 0,
      sample: {
        kelas: data.kelas?.slice(0, 3)  || [],
        siswa: data.siswa?.slice(0, 3)  || [],
        guru:  data.guru?.slice(0, 3)   || [],
      },
    }, 'Preview data SDMS berhasil.');
  } catch (err) {
    return fail(res, `Gagal mengambil preview dari SDMS: ${err.message}`, 503);
  }
};

// ─── POST /api/sync/full ───────────────────────────────────────────────────
// Sync semua: kelas → siswa → guru
exports.syncFull = async (req, res) => {
  if (syncInProgress) {
    return fail(res, 'Sync sedang berjalan. Tunggu hingga selesai.', 409);
  }

  syncInProgress = true;

  // Jalankan async — langsung kembalikan response, client polling /status
  fullSync()
    .then(result => {
      lastSyncResult = { ...result, type: 'full' };
    })
    .catch(err => {
      lastSyncResult = {
        success: false, type: 'full',
        errors: [err.message],
        finishedAt: new Date().toISOString(),
      };
    })
    .finally(() => {
      syncInProgress = false;
    });

  return ok(res, { message: 'Sync dimulai. Pantau progress di /api/sync/status.' }, 'Sync berjalan...');
};

// ─── POST /api/sync/full/await ─────────────────────────────────────────────
// Sync semua — tunggu sampai selesai (untuk data kecil / koneksi cepat)
exports.syncFullAwait = async (req, res) => {
  if (syncInProgress) {
    return fail(res, 'Sync sedang berjalan. Tunggu hingga selesai.', 409);
  }

  syncInProgress = true;
  try {
    const result   = await fullSync();
    lastSyncResult = { ...result, type: 'full' };
    return ok(res, result, result.success ? 'Sync selesai.' : 'Sync selesai dengan beberapa error.');
  } catch (err) {
    lastSyncResult = {
      success: false, type: 'full',
      errors: [err.message],
      finishedAt: new Date().toISOString(),
    };
    return fail(res, `Sync gagal: ${err.message}`, 500);
  } finally {
    syncInProgress = false;
  }
};

// ─── POST /api/sync/:type ──────────────────────────────────────────────────
// Sync sebagian: kelas | siswa | guru
exports.syncPartial = async (req, res) => {
  const { type } = req.params;
  const allowed  = ['kelas', 'siswa', 'guru'];

  if (!allowed.includes(type)) {
    return fail(res, `Tipe sync tidak valid. Pilihan: ${allowed.join(', ')}`, 400);
  }
  if (syncInProgress) {
    return fail(res, 'Sync sedang berjalan. Tunggu hingga selesai.', 409);
  }

  syncInProgress = true;
  try {
    const result   = await syncOne(type);
    lastSyncResult = { ...result, type, success: true, finishedAt: new Date().toISOString() };
    return ok(res, result, `Sync ${type} selesai.`);
  } catch (err) {
    return fail(res, `Sync ${type} gagal: ${err.message}`, 500);
  } finally {
    syncInProgress = false;
  }
};
