'use strict';

const {
  fullSync, syncOne, testConnection, pullFromSdms,
  upsertKelas, upsertSiswa, upsertGuru, syncWaliKelas,
} = require('../services/sdmsSyncService');
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
// Sync sebagian: kelas | siswa | guru | walikelas
exports.syncPartial = async (req, res) => {
  const { type } = req.params;
  const allowed  = ['kelas', 'siswa', 'guru', 'walikelas'];

  if (!allowed.includes(type)) {
    return fail(res, `Tipe sync tidak valid. Pilihan: ${allowed.join(', ')}`, 400);
  }
  if (syncInProgress) {
    return fail(res, 'Sync sedang berjalan. Tunggu hingga selesai.', 409);
  }

  syncInProgress = true;
  try {
    let result;
    if (type === 'walikelas') {
      // Pull kelas data dari SDMS lalu jalankan syncWaliKelas untuk setiap kelas
      const data = await pullFromSdms();
      let synced = 0, failed = 0, errors = [];
      for (const k of (data.kelas || [])) {
        try {
          const kelasNama  = (k.nama      || '').trim();
          const waliNama   = (k.waliKelas || k.wali_kelas || '').trim();
          if (!kelasNama) { failed++; continue; }
          await syncWaliKelas(kelasNama, waliNama);
          synced++;
        } catch (e) {
          failed++;
          errors.push({ item: k.nama, error: e.message });
        }
      }
      result = { synced, failed, errors };
    } else {
      result = await syncOne(type);
    }
    lastSyncResult = { ...result, type, success: true, finishedAt: new Date().toISOString() };
    return ok(res, result, `Sync ${type} selesai.`);
  } catch (err) {
    return fail(res, `Sync ${type} gagal: ${err.message}`, 500);
  } finally {
    syncInProgress = false;
  }
};

// ─── POST /api/sync/webhook ───────────────────────────────────────────────────
// Menerima push dari SDMS — autentikasi via X-Sync-Secret header (bukan JWT)
exports.receiveWebhook = async (req, res) => {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const expectedSecret = process.env.SDMS_SYNC_SECRET || '';
  const incoming = req.headers['x-sync-secret'] || req.query.secret || '';
  if (!expectedSecret || incoming !== expectedSecret) {
    return fail(res, 'Unauthorized: secret tidak valid.', 401);
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  const { entity, action = 'upsert', data } = req.body || {};

  const allowedEntities = ['guru', 'siswa', 'kelas', 'walikelas', 'full'];
  if (!entity || !allowedEntities.includes(entity)) {
    return fail(res, `Entity tidak valid. Pilihan: ${allowedEntities.join(', ')}`, 400);
  }

  // 'full' entity: delegate to fullSync
  if (entity === 'full') {
    try {
      const result = await fullSync();
      lastSyncResult = { ...result, type: 'webhook:full', action, finishedAt: new Date().toISOString() };
      return ok(res, result, 'Webhook full sync diproses.');
    } catch (err) {
      return fail(res, `Webhook full sync error: ${err.message}`, 500);
    }
  }

  if (!data) {
    return fail(res, 'Field "data" wajib ada dalam body.', 400);
  }

  // Normalise to array
  const items = Array.isArray(data) ? data : [data];

  // ── 3. Dispatch ───────────────────────────────────────────────────────────
  try {
    let result;

    if (action === 'delete') {
      result = await handleWebhookDelete(entity, items);
    } else {
      // action === 'upsert' (default)
      switch (entity) {
        case 'kelas':
          result = await upsertKelas(items);
          break;
        case 'siswa':
          result = await upsertSiswa(items);
          break;
        case 'guru':
          result = await upsertGuru(items);
          break;
        case 'walikelas':
          result = await handleWebhookWaliKelas(items);
          break;
      }
    }

    lastSyncResult = {
      ...result,
      type:       `webhook:${entity}`,
      action,
      finishedAt: new Date().toISOString(),
    };
    return ok(res, result, `Webhook ${entity} (${action}) diproses.`);
  } catch (err) {
    return fail(res, `Webhook error: ${err.message}`, 500);
  }
};

// ─── Private helpers for webhook ─────────────────────────────────────────────

// Safe delete: marks entities inactive/exited, never hard-deletes.
async function handleWebhookDelete(entity, items) {
  const { Siswa } = require('../models/index');
  const { Op }   = require('sequelize');

  if (entity === 'guru') {
    // Guru model has no aktif column — log and skip
    console.warn('[Webhook] delete guru: Guru model has no aktif column; skipping hard actions.');
    return { skipped: items.length, reason: 'Guru model lacks aktif flag; no action taken.' };
  }

  if (entity === 'siswa') {
    const nisnList = items.map(s => (s.nisn || '').trim()).filter(Boolean);
    let affected = 0;
    if (nisnList.length) {
      const [n] = await Siswa.update(
        { status: 'Keluar', kelasId: null, kelas: null },
        { where: { nisn: { [Op.in]: nisnList }, status: { [Op.ne]: 'Keluar' } } }
      );
      affected = n;
    }
    return { affected };
  }

  if (entity === 'kelas') {
    // Kelas model has no aktif column — log and skip
    console.warn('[Webhook] delete kelas: Kelas model has no aktif column; skipping.');
    return { skipped: items.length, reason: 'Kelas model lacks aktif flag; no action taken.' };
  }

  if (entity === 'walikelas') {
    // Clear homeroom assignment
    for (const item of items) {
      const kelasNama = (item.kelasNama || '').trim();
      if (kelasNama) await syncWaliKelas(kelasNama, '');
    }
    return { affected: items.length };
  }

  return { affected: 0 };
}

// Webhook-specific walikelas upsert
async function handleWebhookWaliKelas(items) {
  const { Kelas } = require('../models/index');
  let processed = 0, failed = 0, errors = [];

  for (const item of items) {
    try {
      const kelasNama     = (item.kelasNama     || item.kelas_nama     || '').trim();
      const waliKelasNama = (item.waliKelasNama || item.wali_kelas_nama || item.waliKelas || '').trim();
      if (!kelasNama) { failed++; continue; }

      // Update Kelas.waliKelas
      await Kelas.update(
        { waliKelas: waliKelasNama },
        { where: { nama: kelasNama, guruId: null } }
      );

      // Mirror to Guru
      await syncWaliKelas(kelasNama, waliKelasNama);
      processed++;
    } catch (e) {
      failed++;
      errors.push({ item: item.kelasNama, error: e.message });
    }
  }

  return { processed, failed, errors };
}
