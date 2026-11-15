# SDMS Webhook Contract — E-Journal SMK

## Endpoint

```
POST /api/sync/webhook
```

## Authentication

Every request must include the shared secret in one of:
- Header: `X-Sync-Secret: <SDMS_SYNC_SECRET>`
- Query param: `?secret=<SDMS_SYNC_SECRET>`

The secret value must match `SDMS_SYNC_SECRET` in the E-Journal `.env` file.
Requests with a missing or mismatched secret receive **HTTP 401**.

## Request Shape

```json
{
  "entity":  "guru | siswa | kelas | walikelas | full",
  "action":  "upsert | delete",
  "data":    { ...fields } | [ { ...fields }, ... ]
}
```

- `action` defaults to `upsert` when omitted.
- `data` can be a single object or an array.
- For `entity = "full"`, `data` is not required — the server pulls all data from SDMS itself.

---

## Entity Field Shapes

### `guru`

Matches the shape returned by `GET {SDMS_URL}/api/v1/public/sync/data` → `data.guru[]`.

```json
{
  "nama":      "Budi Santoso",
  "nip":       "196501011990031002",
  "jabatan":   "Wali Kelas X RPL 1"
}
```

| Field     | Required | Notes |
|-----------|----------|-------|
| `nama`    | yes      | Upsert key (case-insensitive match). |
| `nip`     | no       | Becomes `username` and initial `password` if ≥ 6 digits. |
| `jabatan` | no       | If contains "wali" and `kelasNama` is set, marks `isWaliKelas=true`. |

---

### `siswa`

```json
{
  "nisn":          "0012345678",
  "nis":           "2024001",
  "nama":          "Andi Wijaya",
  "jenisKelamin":  "L",
  "kelasNama":     "X RPL 1",
  "agama":         "Islam",
  "tanggalLahir":  "2008-05-14",
  "tempatLahir":   "Surabaya",
  "alamat":        "Jl. Merdeka No. 1",
  "namaAyah":      "Bapak Wijaya",
  "namaIbu":       "Ibu Wijaya",
  "telpOrtu":      "08123456789",
  "noHp":          "08129999999",
  "tahunMasuk":    2024,
  "penerimaBantuan": "Tidak",
  "status":        "Aktif"
}
```

| Field       | Required | Stable key | Notes |
|-------------|----------|------------|-------|
| `nisn`      | yes      | ✓          | 10-digit NISN; primary upsert key. |
| `nama`      | yes      | –          | Also accepts `namaLengkap`, `nama_lengkap`, `fullName`. |
| `kelasNama` | no       | –          | Matched to `kelas.nama` (guruId IS NULL); auto-created if missing. |
| `status`    | no       | –          | `aktif/active → Aktif`, `lulus/graduate → Lulus`, `keluar/pindah → Keluar`. |

---

### `kelas`

```json
{
  "nama":         "X RPL 1",
  "tingkat":      "X",
  "jurusan":      "Rekayasa Perangkat Lunak",
  "tahunAjaran":  "2025/2026",
  "waliKelas":    "Budi Santoso",
  "rombel":       "1"
}
```

| Field         | Required | Stable key | Notes |
|---------------|----------|------------|-------|
| `nama`        | yes      | ✓ (part)   | Combined with `tahunAjaran`. |
| `tahunAjaran` | yes      | ✓ (part)   | Also accepted as `tahun_pelajaran`. |
| `tingkat`     | no       | –          | Accepts `X/XI/XII` or `10/11/12`. |
| `waliKelas`   | no       | –          | If present, also updates `Guru.isWaliKelas` and `Guru.kelasWali`. |

---

### `walikelas`

Used when SDMS pushes a homeroom assignment change without resending the full kelas record.

```json
{
  "kelasNama":     "X RPL 1",
  "waliKelasNama": "Budi Santoso"
}
```

| Field           | Required | Notes |
|-----------------|----------|-------|
| `kelasNama`     | yes      | Must match an existing `kelas.nama` (guruId IS NULL). |
| `waliKelasNama` | no       | If empty/omitted, clears the homeroom assignment. |

Effect:
1. `Kelas.waliKelas` is updated to `waliKelasNama`.
2. The Guru row matching `nama = waliKelasNama` gets `isWaliKelas=true`, `kelasWali=kelasNama`.
3. Any other Guru previously assigned as walikelas for this class gets `isWaliKelas=false`, `kelasWali=''`.

---

### `full`

Triggers a full pull-and-upsert from SDMS (kelas → siswa → guru, with walikelas mirroring).
No `data` field needed.

---

## Safe Removal (`action: "delete"`)

| Entity      | Effect |
|-------------|--------|
| `siswa`     | Sets `status='Keluar'`, clears `kelasId` and `kelas`. |
| `walikelas` | Clears `Kelas.waliKelas` and `Guru.isWaliKelas`/`kelasWali`. |
| `guru`      | No-op — Guru model has no `aktif` column; logs a warning. |
| `kelas`     | No-op — Kelas model has no `aktif` column; logs a warning. |

Hard-deletes are never performed. Rows referenced by jurnal, absensi, or nilai are never removed.

---

## Idempotency

All upsert operations are idempotent:
- **kelas**: keyed on `(nama, guruId=NULL, tahunAjaran)` — sending the same payload twice produces the same result.
- **siswa**: keyed on `nisn` — duplicate pushes update in place without creating duplicates.
- **guru**: keyed on `nama` (case-insensitive) — duplicate pushes update in place.
- **walikelas**: assigns a named guru to a named class; running it twice leaves the same state.

---

## Example Requests

### Push kelas update

```http
POST /api/sync/webhook
Content-Type: application/json
X-Sync-Secret: SDMS_SYNC_SECRET_2026

{
  "entity": "kelas",
  "data": [
    { "nama": "X RPL 1",  "tingkat": "X",  "jurusan": "RPL", "tahunAjaran": "2025/2026", "waliKelas": "Budi Santoso" },
    { "nama": "XI RPL 1", "tingkat": "XI", "jurusan": "RPL", "tahunAjaran": "2025/2026", "waliKelas": "Siti Rahayu" }
  ]
}
```

Response (HTTP 200):

```json
{
  "success": true,
  "message": "Webhook kelas (upsert) diproses.",
  "data": { "created": 0, "updated": 2, "failed": 0, "errors": [] }
}
```

### Push siswa update

```http
POST /api/sync/webhook
Content-Type: application/json
X-Sync-Secret: SDMS_SYNC_SECRET_2026

{
  "entity": "siswa",
  "data": {
    "nisn": "0012345678",
    "nama": "Andi Wijaya",
    "kelasNama": "X RPL 1",
    "jenisKelamin": "L",
    "status": "Aktif"
  }
}
```

### Reassign walikelas

```http
POST /api/sync/webhook
Content-Type: application/json
X-Sync-Secret: SDMS_SYNC_SECRET_2026

{
  "entity": "walikelas",
  "data": { "kelasNama": "X RPL 1", "waliKelasNama": "Ahmad Fauzi" }
}
```

### Safe-delete siswa

```http
POST /api/sync/webhook
Content-Type: application/json
X-Sync-Secret: SDMS_SYNC_SECRET_2026

{
  "entity": "siswa",
  "action": "delete",
  "data": [{ "nisn": "0012345678" }, { "nisn": "0098765432" }]
}
```

### Full sync trigger

```http
POST /api/sync/webhook
Content-Type: application/json
X-Sync-Secret: SDMS_SYNC_SECRET_2026

{
  "entity": "full"
}
```

---

## Response Shape

All responses follow the standard E-Journal API envelope:

```json
{
  "success": true | false,
  "message": "...",
  "data":    { ...result }
}
```

HTTP status codes:
- `200` — processed (even if individual items had failures, check `data.errors`)
- `400` — bad request (missing or invalid `entity`/`data`)
- `401` — secret missing or incorrect
- `500` — internal error
