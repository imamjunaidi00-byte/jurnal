'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 * SDMS Sync Service — E-Journal Guru
 * ═══════════════════════════════════════════════════════════════
 * Pull data dari SDMS Public Sync API, lalu upsert ke database jurnal.
 *
 * Flow:
 *   1. GET {SDMS_SYNC_URL}/api/v1/public/sync/data?secret=...
 *   2. Upsert Kelas  → tabel kelas
 *   3. Upsert Siswa  → tabel siswas
 *   4. Upsert Guru   → tabel gurus (hanya sebagai data profil, bukan akun login)
 *   5. Return summary { kelas, siswa, guru, mapel }
 */

const https  = require('https');
const http   = require('http');
const { URL } = require('url');

const { Kelas, Siswa, Guru, MappingMapel, sequelize } = require('../models/index');
const { Op } = require('sequelize');

// ─── Helper: fetch via http/https native (tanpa axios agar tidak butuh install) ─
function fetchJson(urlStr, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(urlStr);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Accept': 'application/json' },
      timeout:  timeoutMs,
    };

    const req = lib.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
          }
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.on('error',   (e) => reject(e));
    req.end();
  });
}

// ─── Normalisasi tingkat kelas: 'X' → 10, 'XI' → 11, 'XII' → 12 ─────────────
function normTingkat(t) {
  if (!t) return 10;
  if (typeof t === 'number') return t;
  const map = { 'X': 10, 'XI': 11, 'XII': 12 };
  return map[String(t).toUpperCase()] || parseInt(t, 10) || 10;
}

// ─── Normalisasi penerima bantuan ─────────────────────────────────────────────
function normBantuan(raw) {
  if (!raw) return 'Tidak';
  const v = String(raw).trim();
  const valid = ['Tidak','PIP','KIP','BSM','PKH','Lainnya'];
  return valid.includes(v) ? v : 'Lainnya';
}

// ══════════════════════════════════════════════════════════════════════════════
// PULL: Ambil semua data dari SDMS
// ══════════════════════════════════════════════════════════════════════════════
async function pullFromSdms() {
  const baseUrl = (process.env.SDMS_SYNC_URL || '').replace(/\/$/, '');
  const secret  = process.env.SDMS_SYNC_SECRET || 'SDMS_SYNC_SECRET_2026';

  if (!baseUrl) throw new Error('SDMS_SYNC_URL belum diset di .env');

  const url  = `${baseUrl}/api/v1/public/sync/data?secret=${encodeURIComponent(secret)}`;
  const json = await fetchJson(url);

  if (json.status !== 'success') {
    throw new Error(json.message || 'SDMS mengembalikan status error');
  }

  return json.data; // { guru, siswa, kelas, mapel }
}

// ══════════════════════════════════════════════════════════════════════════════
// UPSERT: Kelas
// ══════════════════════════════════════════════════════════════════════════════
async function upsertKelas(kelasList) {
  let created = 0, updated = 0, failed = 0, errors = [];

  for (const k of kelasList) {
    try {
      const nama        = (k.nama || '').trim();
      const tingkat     = normTingkat(k.tingkat);
      const jurusan     = (k.jurusan || '').trim();
      const tahunAjaran = (k.tahunAjaran || k.tahun_pelajaran || '').trim();
      const waliKelas   = (k.waliKelas || k.wali_kelas || '').trim();

      if (!nama) { failed++; continue; }

      // Cari berdasarkan nama + tahunAjaran (data global guruId = null)
      const where = { nama, guruId: null };
      if (tahunAjaran) where.tahunAjaran = tahunAjaran;

      const existing = await Kelas.findOne({ where });

      if (existing) {
        await existing.update({
          tingkat, jurusan: jurusan || existing.jurusan,
          tahunAjaran: tahunAjaran || existing.tahunAjaran,
          waliKelas: waliKelas || existing.waliKelas,
        });
        updated++;
      } else {
        await Kelas.create({
          nama, tingkat, jurusan: jurusan || '-',
          tahunAjaran: tahunAjaran || '-',
          waliKelas, guruId: null, rombel: '1',
        });
        created++;
      }
    } catch (e) {
      failed++;
      errors.push({ item: k.nama, error: e.message });
    }
  }

  return { created, updated, failed, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// UPSERT: Siswa
// ══════════════════════════════════════════════════════════════════════════════
async function upsertSiswa(siswaList) {
  let created = 0, updated = 0, failed = 0, errors = [];

  for (const s of siswaList) {
    try {
      const nisn = (s.nisn || '').trim();
      const nama = (s.nama || s.namaLengkap || '').trim();
      const jk   = (s.jenisKelamin || s.jenis_kelamin || 'L').toUpperCase().trim();

      if (!nama || !nisn) { failed++; continue; }

      // Cari kelasId dari nama kelas
      const kelasNama = (s.kelasNama || s.kelas?.nama || '').trim();
      let kelasId = null;
      if (kelasNama) {
        const kelasRow = await Kelas.findOne({
          where: { nama: kelasNama, guruId: null },
          attributes: ['id'],
        });
        kelasId = kelasRow?.id || null;
      }

      const payload = {
        nama,
        nisn,
        nis:             (s.nis || '').trim() || null,
        jenisKelamin:    ['L','P'].includes(jk) ? jk : 'L',
        kelas:           kelasNama || null,
        kelasId,
        tempatLahir:     s.tempatLahir    || s.tempat_lahir    || null,
        tanggalLahir:    s.tanggalLahir   || s.tanggal_lahir   || null,
        agama:           s.agama          || null,
        alamat:          s.alamat         || null,
        namaAyah:        s.namaAyah       || s.nama_ayah       || null,
        namaIbu:         s.namaIbu        || s.nama_ibu        || null,
        telpOrtu:        s.telpOrtu       || s.hp_ortu         || null,
        noHp:            s.noTelp         || s.no_hp           || null,
        tahunMasuk:      s.tahunMasuk     || s.tahun_masuk     || null,
        penerimaBantuan: normBantuan(s.penerimaBantuan || s.pernah_dapat_bantuan),
        status:          s.status === 'Aktif' ? 'Aktif' : (s.status || 'Aktif'),
        guruId:          null,
      };

      const existing = await Siswa.findOne({ where: { nisn } });

      if (existing) {
        // Jangan timpa data yang sudah ada jika lebih lengkap
        await existing.update({
          nama:            payload.nama,
          kelas:           payload.kelas           || existing.kelas,
          kelasId:         payload.kelasId         ?? existing.kelasId,
          jenisKelamin:    payload.jenisKelamin,
          tempatLahir:     payload.tempatLahir      || existing.tempatLahir,
          tanggalLahir:    payload.tanggalLahir     || existing.tanggalLahir,
          agama:           payload.agama            || existing.agama,
          alamat:          payload.alamat           || existing.alamat,
          namaAyah:        payload.namaAyah         || existing.namaAyah,
          namaIbu:         payload.namaIbu          || existing.namaIbu,
          telpOrtu:        payload.telpOrtu         || existing.telpOrtu,
          noHp:            payload.noHp             || existing.noHp,
          tahunMasuk:      payload.tahunMasuk       || existing.tahunMasuk,
          penerimaBantuan: payload.penerimaBantuan,
          status:          payload.status,
          nis:             payload.nis              || existing.nis,
        });
        updated++;
      } else {
        await Siswa.create(payload);
        created++;
      }
    } catch (e) {
      failed++;
      errors.push({ item: s.nisn || s.nama, error: e.message });
    }
  }

  return { created, updated, failed, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// UPSERT: Guru (hanya update data profil — BUKAN buat akun login baru)
// ══════════════════════════════════════════════════════════════════════════════
async function upsertGuru(guruList) {
  let updated = 0, skipped = 0, errors = [];

  for (const g of guruList) {
    try {
      const nama = (g.nama || g.namaLengkap || '').trim();
      if (!nama) { skipped++; continue; }

      // Cari akun guru berdasarkan nama (case-insensitive)
      // SDMS tidak punya username jurnal — hanya update data yang sudah ada
      const existing = await Guru.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('nama')),
          sequelize.fn('LOWER', nama)
        ),
      });

      if (existing) {
        // Update info wali kelas jika data SDMS menyebutkan jabatan
        const jabatan = (g.jabatan || '').toLowerCase();
        if (jabatan.includes('wali') && g.kelasNama) {
          await existing.update({ isWaliKelas: true, kelasWali: g.kelasNama });
        }
        updated++;
      } else {
        // Guru belum punya akun di jurnal — skip, bukan otomatis dibuat
        // Admin harus buat akun guru secara manual atau via import
        skipped++;
      }
    } catch (e) {
      errors.push({ item: g.nama, error: e.message });
    }
  }

  return { updated, skipped, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE jumlahSiswa di setiap kelas
// ══════════════════════════════════════════════════════════════════════════════
async function updateJumlahSiswaKelas() {
  try {
    const kelasList = await Kelas.findAll({ where: { guruId: null }, attributes: ['id'] });
    for (const k of kelasList) {
      const count = await Siswa.count({ where: { kelasId: k.id, status: 'Aktif' } });
      await k.update({ jumlahSiswa: count });
    }
  } catch (e) {
    console.error('[SdmsSync] updateJumlahSiswaKelas error:', e.message);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL SYNC
// ══════════════════════════════════════════════════════════════════════════════
async function fullSync() {
  const startTime = Date.now();
  const result = {
    success:   true,
    startedAt: new Date().toISOString(),
    duration:  null,
    kelas:     null,
    siswa:     null,
    guru:      null,
    errors:    [],
  };

  try {
    // 1. Pull dari SDMS
    const data = await pullFromSdms();
    result.pulled = {
      kelas: data.kelas?.length  || 0,
      siswa: data.siswa?.length  || 0,
      guru:  data.guru?.length   || 0,
      mapel: data.mapel?.length  || 0,
    };

    // 2. Upsert Kelas dulu (siswa butuh kelasId)
    if (data.kelas?.length) {
      result.kelas = await upsertKelas(data.kelas);
    } else {
      result.kelas = { created: 0, updated: 0, failed: 0 };
    }

    // 3. Upsert Siswa
    if (data.siswa?.length) {
      result.siswa = await upsertSiswa(data.siswa);
    } else {
      result.siswa = { created: 0, updated: 0, failed: 0 };
    }

    // 3b. Update jumlahSiswa di setiap kelas berdasarkan count aktual
    await updateJumlahSiswaKelas();

    // 4. Update info Guru (wali kelas, dll)
    if (data.guru?.length) {
      result.guru = await upsertGuru(data.guru);
    } else {
      result.guru = { updated: 0, skipped: 0 };
    }

  } catch (e) {
    result.success = false;
    result.errors.push(e.message);
  }

  result.duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
  result.finishedAt = new Date().toISOString();

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTIAL SYNC (hanya satu entitas)
// ══════════════════════════════════════════════════════════════════════════════
async function syncOne(type) {
  const data = await pullFromSdms();
  switch (type) {
    case 'kelas':  return { kelas:  await upsertKelas(data.kelas  || []) };
    case 'siswa':  return { siswa:  await upsertSiswa(data.siswa  || []) };
    case 'guru':   return { guru:   await upsertGuru(data.guru    || []) };
    default: throw new Error(`Tipe sync tidak dikenal: ${type}`);
  }
}

// ── Test koneksi ke SDMS ───────────────────────────────────────────────────
async function testConnection() {
  const baseUrl = (process.env.SDMS_SYNC_URL || '').replace(/\/$/, '');
  if (!baseUrl) throw new Error('SDMS_SYNC_URL belum diset di .env');
  const json = await fetchJson(`${baseUrl}/api/v1/public/sync/health`, 8000);
  return json;
}

module.exports = { fullSync, syncOne, testConnection, pullFromSdms };
