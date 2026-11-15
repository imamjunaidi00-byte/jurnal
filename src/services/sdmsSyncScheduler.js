'use strict';

const { fullSync } = require('./sdmsSyncService');

/**
 * startScheduler()
 *
 * Call once after connectDB() resolves. Starts a setInterval that runs fullSync()
 * every SDMS_SYNC_INTERVAL_MS milliseconds (default 600 000 = 10 min).
 * Errors are caught and logged; they never crash the process.
 * If SDMS_SYNC_URL is not configured, logs a warning and returns without
 * starting the interval.
 */
function startScheduler() {
  if (!process.env.SDMS_SYNC_URL) {
    console.warn('[SDMS Scheduler] SDMS_SYNC_URL tidak dikonfigurasi — auto-sync tidak dijalankan.');
    return;
  }

  const intervalMs = parseInt(process.env.SDMS_SYNC_INTERVAL_MS, 10) || 600_000;
  const minLabel   = (intervalMs / 60_000).toFixed(1).replace(/\.0$/, '');

  console.log(`[SDMS Scheduler] Active — interval ${intervalMs}ms (${minLabel}min)`);

  setInterval(async () => {
    console.log('[SDMS Scheduler] Menjalankan full sync otomatis...');
    try {
      const result = await fullSync();
      console.log(
        `[SDMS Scheduler] Sync selesai. Durasi: ${result.duration}` +
        ` | kelas: ${result.kelas?.created ?? 0}c+${result.kelas?.updated ?? 0}u` +
        ` | siswa: ${result.siswa?.created ?? 0}c+${result.siswa?.updated ?? 0}u` +
        ` | guru: ${result.guru?.created ?? 0}c+${result.guru?.updated ?? 0}u`
      );
    } catch (err) {
      console.error('[SDMS Scheduler] Sync gagal (proses tetap berjalan):', err.message);
    }
  }, intervalMs);
}

module.exports = { startScheduler };
