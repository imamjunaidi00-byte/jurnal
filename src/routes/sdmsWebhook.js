'use strict';

/**
 * Route: POST /api/webhooks/sdms
 *
 * Menerima push event dari SDMS syncService (format event-driven).
 * SDMS mengirim dengan header X-SDMS-Secret + body { event, payload, meta }.
 *
 * Event yang didukung:
 *   guru.created  / guru.updated  / guru.deleted
 *   siswa.created / siswa.updated / siswa.deleted
 *   kelas.created / kelas.updated / kelas.deleted
 *   bulk.sync
 *
 * Ditranslate ke handler upsert/delete yang sudah ada di sdmsSyncService.
 */

const router = require('express').Router();
const {
  upsertKelas, upsertSiswa, upsertGuru, syncWaliKelas, fullSync,
} = require('../services/sdmsSyncService');
const { Kelas } = require('../models/index');

// ── Auth helper ───────────────────────────────────────────────────────────────
function checkSecret(req, res) {
  const expected = (process.env.SDMS_SYNC_SECRET || '').trim();
  // SDMS mengirim secret di header X-SDMS-Secret
  const incoming = (
    req.headers['x-sdms-secret'] ||
    req.headers['x-sync-secret'] ||
    req.query.secret ||
    ''
  ).trim();

  if (!expected || incoming !== expected) {
    res.status(401).json({ success: false, message: 'Unauthorized: secret tidak valid.' });
    return false;
  }
  return true;
}

// ── POST /api/webhooks/sdms ───────────────────────────────────────────────────
router.post('/sdms', async (req, res) => {
  if (!checkSecret(req, res)) return;

  const { event, payload } = req.body || {};

  if (!event) {
    return res.status(400).json({ success: false, message: 'Field "event" wajib ada.' });
  }

  console.log(`[SDMS Webhook] Event diterima: ${event}`);

  try {
    // ── bulk.sync: jalankan fullSync ────────────────────────────────────────
    if (event === 'bulk.sync') {
      // SDMS bisa kirim seluruh data sekaligus — upsert semua entitas
      const data = payload || {};
      const results = {};

      if (Array.isArray(data.kelas) && data.kelas.length) {
        results.kelas = await upsertKelas(data.kelas);
      }
      if (Array.isArray(data.siswa) && data.siswa.length) {
        results.siswa = await upsertSiswa(data.siswa);
      }
      if (Array.isArray(data.guru) && data.guru.length) {
        results.guru = await upsertGuru(data.guru);
      }

      console.log(`[SDMS Webhook] bulk.sync selesai:`, JSON.stringify(results));
      return res.json({ success: true, event, results });
    }

    // ── Tentukan entitas dan aksi dari nama event ───────────────────────────
    // Format: "<entity>.<action>"  contoh: "guru.updated", "kelas.deleted"
    const [entity, action] = event.split('.');

    if (!entity || !action) {
      return res.status(400).json({ success: false, message: `Format event tidak dikenal: ${event}` });
    }

    // Normalise payload ke array
    const items = Array.isArray(payload) ? payload : (payload ? [payload] : []);

    if (!items.length && action !== 'deleted') {
      return res.status(400).json({ success: false, message: 'Payload kosong.' });
    }

    let result;

    // ── GURU ─────────────────────────────────────────────────────────────────
    if (entity === 'guru') {
      if (action === 'deleted') {
        // Guru: soft-flag saja — tidak ada kolom aktif di model Jurnal,
        // cukup log. Data guru yang dihapus di SDMS tidak dihapus di Jurnal
        // agar history jurnal mengajar tetap utuh.
        console.warn(`[SDMS Webhook] guru.deleted diterima — data guru tidak dihapus di Jurnal (history tetap).`);
        result = { skipped: items.length, reason: 'Guru tidak dihapus untuk menjaga history jurnal.' };
      } else {
        result = await upsertGuru(items);
      }
    }

    // ── SISWA ─────────────────────────────────────────────────────────────────
    else if (entity === 'siswa') {
      if (action === 'deleted') {
        const { Siswa } = require('../models/index');
        const { Op }    = require('sequelize');
        const nisnList  = items.map(s => (s.nisn || '').trim()).filter(Boolean);
        let affected = 0;
        if (nisnList.length) {
          const [n] = await Siswa.update(
            { status: 'Keluar', kelasId: null, kelas: null },
            { where: { nisn: { [Op.in]: nisnList }, status: { [Op.ne]: 'Keluar' } } }
          );
          affected = n;
        }
        result = { affected };
      } else {
        result = await upsertSiswa(items);
      }
    }

    // ── KELAS ─────────────────────────────────────────────────────────────────
    else if (entity === 'kelas') {
      if (action === 'deleted') {
        // Kelas: tidak dihapus (ada siswa/jurnal yang mereferensi)
        console.warn(`[SDMS Webhook] kelas.deleted diterima — kelas tidak dihapus di Jurnal (ada referensi data).`);
        result = { skipped: items.length, reason: 'Kelas tidak dihapus untuk menjaga referensi jurnal/absensi.' };
      } else {
        result = await upsertKelas(items);
        // syncWaliKelas dipanggil otomatis dari dalam upsertKelas
      }
    }

    // ── Event tidak dikenal — abaikan dengan 200 agar SDMS tidak retry ────────
    else {
      console.log(`[SDMS Webhook] Event "${event}" tidak membutuhkan aksi di Jurnal — diabaikan.`);
      result = { ignored: true, reason: `Entity "${entity}" tidak dikelola oleh Jurnal.` };
    }

    console.log(`[SDMS Webhook] ${event} selesai:`, JSON.stringify(result));
    return res.json({ success: true, event, result });

  } catch (err) {
    console.error(`[SDMS Webhook] Error pada event "${event}":`, err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
