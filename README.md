# E-Journal SMK v2.0

> Sistem Jurnal Mengajar Digital untuk SMK — dibangun dengan **Node.js**, **Express**, dan **MariaDB** (Sequelize ORM).

[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green)](https://nodejs.org)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.6%2B-blue)](https://mariadb.org)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-orange)](https://sequelize.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ⚠️ Catatan Migrasi Database

> **v2.0 menggunakan MariaDB/MySQL — bukan lagi MongoDB.**
>
> Jika Anda menggunakan versi lama (MongoDB), **tidak ada migrasi otomatis**. Pasang ulang dari awal menggunakan panduan di bawah.

---

## Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| 👥 Manajemen Guru | Akun guru dari SDMS (username = NIP, password = NIP) |
| 🎓 Master Siswa | 1205+ siswa dari sinkronisasi SDMS |
| 🏫 Master Kelas | Kelola kelas global oleh admin |
| 📋 Absensi | Per mata pelajaran & absensi harian kelas |
| 📊 Nilai | Input nilai dengan hitung otomatis (NA, Predikat) |
| 😊 Sikap | Penilaian sikap spiritual & sosial |
| 📓 Jurnal Mengajar | Log harian kegiatan pembelajaran |
| 🗓️ Jadwal | Jadwal pelajaran per guru |
| 🗺️ Mind Map | Materi pembelajaran visual |
| 🔄 Sinkronisasi SDMS | Tarik data guru/siswa/kelas dari SDMS otomatis |
| 🎒 Portal Siswa | Login siswa via NISN + password, lihat nilai & absensi |
| 🏠 Wali Kelas | Absensi harian via akun pengabsen kelas |
| 🔐 SSO | Single Sign-On dengan SDMS |

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4 |
| **Database** | **MariaDB 10.6+ / MySQL 8+** ← baru |
| **ORM** | **Sequelize 6** ← baru (menggantikan Mongoose) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Process Manager | PM2 |
| Web Server | Nginx / Caddy (reverse proxy) |
| OS Target | Ubuntu 24.04 LTS |

---

## Struktur Proyek

```
ejournal-smk/
├── server.js                     # Entry point
├── ecosystem.config.js           # PM2 config
├── package.json
├── .env.example                  # Template environment variables
├── install.sh                    # Script instalasi otomatis Ubuntu 24
├── setup-db.sh                   # Script setup database saja
├── update.sh                     # Script update dari GitHub
│
├── src/
│   ├── config/
│   │   └── database.js           # Sequelize + MariaDB connection config
│   │
│   ├── models/                   # Sequelize models (MariaDB)
│   │   ├── index.js              # Model registry + semua relasi
│   │   ├── Guru.js               # User (guru & admin) — username = NIP
│   │   ├── Kelas.js              # Master kelas
│   │   ├── Siswa.js              # Master siswa — login via NISN + password
│   │   ├── MappingMapel.js       # Daftar mata pelajaran guru
│   │   ├── GuruKelas.js          # Relasi guru↔kelas↔mapel
│   │   ├── Absensi.js            # Absensi per mata pelajaran
│   │   ├── AbsensiHarian.js      # Absensi harian kelas (wali kelas)
│   │   ├── Nilai.js              # Nilai akademik (auto-compute)
│   │   ├── Sikap.js              # Penilaian sikap (auto-compute)
│   │   ├── Jurnal.js             # Jurnal mengajar harian
│   │   ├── Jadwal.js             # Jadwal pelajaran
│   │   ├── MindMap.js            # Mind map materi
│   │   ├── PengabsenKelas.js     # Akun pengurus absensi harian
│   │   ├── Profil.js             # Profil & preferensi guru
│   │   ├── Config.js             # Konfigurasi per guru (semester aktif)
│   │   ├── LoginLog.js           # Log aktivitas login
│   │   └── AppSetting.js         # Pengaturan global aplikasi
│   │
│   ├── controllers/              # Business logic per domain
│   ├── routes/                   # Definisi endpoint REST API
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT: protect, adminOnly, protectPengabsen
│   │   ├── upload.js             # Multer file upload (Excel/CSV max 5MB)
│   │   └── rateLimit.js          # In-memory rate limiter
│   │
│   ├── services/
│   │   └── sdmsSyncService.js    # Sinkronisasi data dari SDMS
│   │
│   ├── utils/
│   │   ├── response.js           # Standar response helper
│   │   ├── excel.js              # Read/write Excel (xlsx)
│   │   └── cache.js              # In-memory cache dengan TTL
│   │
│   └── database/
│       ├── migrate.js            # Sequelize sync — buat/update semua tabel
│       ├── seed.js               # Buat akun admin pertama
│       └── schema.sql            # DDL referensi manual (dokumentasi)
│
├── public/                       # Frontend HTML/CSS/JS
├── uploads/                      # File upload sementara
└── logs/                         # PM2 log files
```

---

## Instalasi di Ubuntu 24 LTS (Server Baru)

### Prasyarat
- Ubuntu 24.04 LTS (fresh install)
- Akses root atau sudo
- Domain/subdomain yang sudah diarahkan ke IP server (opsional, untuk SSL)
- Caddy atau Nginx di server lain sebagai reverse proxy (opsional)

---

### Langkah 1 — Clone repository

```bash
# Login ke server
ssh root@IP_SERVER

# Clone ke direktori aplikasi
git clone https://github.com/imamjunaidi00-byte/jurnal.git /var/www/ejournal
cd /var/www/ejournal
```

---

### Langkah 2 — Jalankan script instalasi otomatis

Script ini menginstall: **Node.js 20**, **MariaDB**, **PM2**, **UFW Firewall**.

> ⚠️ Nginx/Certbot **TIDAK** diinstall karena menggunakan Caddy eksternal.

```bash
# Set variabel (opsional)
export DB_PASS="password_aman_anda_di_sini"

sudo bash /var/www/ejournal/install.sh
```

Script akan menampilkan **kredensial database** di akhir. **Catat dan simpan di tempat aman!**

---

### Langkah 3 — Konfigurasi environment

```bash
cd /var/www/ejournal

# Salin template
cp .env.example .env

# Edit sesuaikan
nano .env
```

Isi yang **wajib** disesuaikan:

```env
NODE_ENV=production
PORT=3000

# ── Database MariaDB ─────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ejournal_smk
DB_USER=ejournal_user
DB_PASS=password_dari_install_sh   # ← dari output install.sh

# ── JWT ─────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=ganti_dengan_string_acak_minimal_64_karakter
JWT_EXPIRE=30d

# ── Sinkronisasi SDMS (opsional) ─────────────────
SDMS_SYNC_URL=https://sdms.sekolah.sch.id
SDMS_SYNC_SECRET=SDMS_SYNC_SECRET_2026

# ── Portal Siswa ─────────────────────────────────
SISWA_DEFAULT_PASSWORD=smkn1kras
```

---

### Langkah 4 — Install dependencies

```bash
npm install --omit=dev
```

---

### Langkah 5 — Setup database MariaDB

```bash
# Buat semua tabel (otomatis via Sequelize sync)
node src/database/migrate.js
```

Output yang benar:
```
✅ MariaDB/MySQL Connected: localhost:3306/ejournal_smk
✅ All tables synced successfully.
✅ Default app identity created.
🎉 Migration completed successfully!
```

---

### Langkah 6 — Buat akun admin pertama

```bash
# Default: username=admin, password=Admin@1234
node src/database/seed.js

# Atau custom:
ADMIN_USER=admin ADMIN_PASS=PasswordKuat@123 ADMIN_NAMA="Nama Admin" node src/database/seed.js
```

> ⚠️ **Segera ganti password admin setelah login pertama!**

---

### Langkah 7 — Jalankan aplikasi

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

### Langkah 8 — Verifikasi

```bash
# Cek status
pm2 status

# Test API
curl http://localhost:3000/api/health
```

Response yang benar:
```json
{
  "status": "OK",
  "db": "connected",
  "uptime": 5,
  "memory": "45MB",
  "version": "2.0.0"
}
```

---

### Langkah 9 — Konfigurasi Caddy (jika pakai Caddy eksternal)

Di server Caddy, tambahkan ke `Caddyfile`:

```caddy
jurnal.sekolah.sch.id {
    encode gzip zstd

    reverse_proxy http://IP_SERVER_APLIKASI:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Caddy otomatis handle SSL Let's Encrypt.

**Keamanan — batasi akses port 3000 hanya dari Caddy:**

```bash
# Di server aplikasi
ufw delete allow 3000/tcp
ufw allow from IP_SERVER_CADDY to any port 3000
ufw status
```

---

## Sinkronisasi Data dari SDMS

Aplikasi ini terintegrasi dengan **SDMS (Sistem Data Manajemen Sekolah)** untuk sinkronisasi data guru, siswa, dan kelas.

### Cara Sync

1. Login sebagai **admin** di `https://jurnal.sekolah.sch.id/admin`
2. Buka tab **Lainnya** → panel **Sinkronisasi Data SDMS**
3. Klik **Test Koneksi** — pastikan terhubung ke SDMS
4. Klik **Preview Data** — lihat jumlah data yang akan diimport
5. Klik **Sync Semua** — data masuk otomatis

### Kredensial Akun Guru (hasil sync)

| Field | Nilai |
|-------|-------|
| Username | **NIP guru** (angka, contoh: `196501011990031002`) |
| Password | **NIP yang sama** (default, bisa diganti) |
| Jika tidak ada NIP | Username dari nama, password `Guru@1234` |

### Kredensial Portal Siswa

| Field | Nilai |
|-------|-------|
| Username | **NISN siswa** |
| Password | `smkn1kras` (default, bisa diganti siswa sendiri) |

---

## Penggunaan

### Admin Panel
**URL:** `https://jurnal.sekolah.sch.id/admin`

| Fungsi | Keterangan |
|--------|------------|
| Tab Guru | Kelola akun guru, reset password, set wali kelas |
| Tab Master Siswa | Import/export siswa, lihat data 1200+ siswa |
| Tab Master Kelas | Buat/edit kelas, lihat jumlah siswa per kelas |
| Tab Lainnya | Identitas aplikasi, manajemen admin, **Sync SDMS** |

### Aplikasi Guru
**URL:** `https://jurnal.sekolah.sch.id/app`

Login dengan username NIP dan password NIP (dari sync SDMS).

### Portal Siswa
**URL:** `https://jurnal.sekolah.sch.id/siswa`

Login dengan NISN dan password `smkn1kras`.

### Absensi Kelas (Pengabsen)
**URL:** `https://jurnal.sekolah.sch.id/absensi-kelas`

Login dengan akun pengabsen yang dibuat oleh wali kelas.

---

## API Endpoints

### Autentikasi
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Login guru/admin — `{ username, password }` |
| GET | `/api/auth/me` | Info user saat ini (Bearer token) |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| PUT | `/api/auth/password` | Ganti password — `{ passwordLama, passwordBaru }` |
| PUT | `/api/auth/username` | Ganti username — `{ usernameBaru }` |
| GET | `/api/auth/accounts` | Info akun sendiri |
| GET | `/api/auth/check-setup` | Cek apakah sudah ada admin |

### Admin (token admin required)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/admin/stats` | Statistik dashboard |
| GET/POST | `/api/admin/guru` | Daftar/buat akun guru |
| PUT | `/api/admin/guru/:id/edit` | Edit data guru |
| PUT | `/api/admin/guru/:id/reset-password` | Reset password guru |
| DELETE | `/api/admin/guru/:id` | Hapus guru + semua data |
| POST | `/api/admin/guru/sync-reset` | Reset akun guru (sebelum sync ulang) |
| PUT | `/api/admin/guru/:id/wali-kelas` | Set/unset wali kelas |
| GET/POST | `/api/admin/admins` | Daftar/buat akun admin |
| GET/PUT | `/api/admin/app-identity` | Identitas aplikasi |
| GET | `/api/admin/aktivitas` | Log aktivitas login (10 terbaru) |
| GET/POST | `/api/admin/kelas` | Master kelas |
| POST | `/api/admin/kelas/recalculate` | Hitung ulang jumlah siswa |
| GET/POST | `/api/admin/siswa` | Master siswa |
| POST | `/api/admin/siswa/import` | Import siswa dari Excel |
| GET | `/api/admin/siswa/export/excel` | Export siswa ke Excel |

### Sinkronisasi SDMS (token admin required)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/sync/status` | Status sync terakhir |
| GET | `/api/sync/test` | Test koneksi ke SDMS |
| GET | `/api/sync/preview` | Preview jumlah data di SDMS |
| POST | `/api/sync/full/await` | Sync semua (tunggu selesai) |
| POST | `/api/sync/:type` | Sync sebagian: `kelas`, `siswa`, `guru` |

### Guru (Bearer token required)
| Prefix | Keterangan |
|--------|------------|
| `/api/absensi` | Absensi per mata pelajaran |
| `/api/absensi/rekap-gabungan` | Rekap gabungan AbsensiHarian + Absensi mapel |
| `/api/nilai` | Input & rekap nilai |
| `/api/sikap` | Penilaian sikap |
| `/api/jurnal` | Jurnal mengajar |
| `/api/jadwal` | Jadwal pelajaran |
| `/api/mindmap` | Mind map materi |
| `/api/guru-kelas` | Penugasan kelas-mapel |
| `/api/mapping-mapel` | Daftar mata pelajaran |
| `/api/profil` | Profil & preferensi (tersimpan ke DB) |
| `/api/config` | Semester & tahun ajaran aktif |

### Portal Siswa (public — auth via NISN + password)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/siswa-portal/login` | Login `{ nisn, password }` → JWT token |
| GET | `/api/siswa-portal/me` | Info siswa dari token |
| PUT | `/api/siswa-portal/profil` | Update profil (alamat, noHp) |
| PUT | `/api/siswa-portal/password` | Ganti password `{ passwordLama, passwordBaru }` |
| GET | `/api/siswa-portal/nilai` | Nilai yang dipublish guru |
| GET | `/api/siswa-portal/absensi` | Rekap absensi |
| GET | `/api/siswa-portal/jadwal` | Jadwal kelas |
| GET | `/api/siswa-portal/materi` | Mind map/materi pembelajaran |

### Wali Kelas & Pengabsen
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET/POST | `/api/wali-kelas/pengabsen` | Kelola akun pengabsen |
| GET | `/api/wali-kelas/absensi-harian` | Absensi harian kelas |
| GET | `/api/wali-kelas/rekap` | Rekap absensi harian |
| POST | `/api/wali-kelas/pengabsen-login` | Login pengabsen |
| POST | `/api/wali-kelas/input-absensi` | Input absensi (pengabsen) |

---

## Update Aplikasi

```bash
cd /var/www/ejournal
bash update.sh
```

`update.sh` otomatis: **git pull → npm install → migrate → pm2 reload**

---

## Maintenance

### Backup database

```bash
# Backup
mysqldump -u ejournal_user -p ejournal_smk > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mysql -u ejournal_user -p ejournal_smk < backup_20260901_120000.sql
```

### Reset database (hati-hati — hapus semua data!)

```bash
node src/database/migrate.js --reset
node src/database/seed.js
```

### Lihat log aplikasi

```bash
pm2 logs ejournal-smk              # live log
pm2 logs ejournal-smk --lines 100  # 100 baris terakhir
pm2 logs ejournal-smk --err        # error log saja
```

### Monitor resource

```bash
pm2 monit
```

---

## Setup SSL (HTTPS) dengan Certbot

Jika menggunakan Nginx langsung (bukan Caddy):

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d jurnal.sekolah.sch.id
# Auto-renew sudah aktif via systemd timer
```

---

## Troubleshooting

**Aplikasi tidak bisa connect ke database (500 error)**
```bash
# Cek MariaDB berjalan
systemctl status mariadb

# Test koneksi manual
mysql -u ejournal_user -p ejournal_smk -e "SELECT 1"

# Cek .env
cat /var/www/ejournal/.env | grep DB_
```

**Port 3000 tidak bisa diakses dari Caddy**
```bash
# Cek PM2
pm2 status
pm2 restart ejournal-smk

# Cek port aktif
ss -tlnp | grep 3000

# Cek UFW rule
ufw status
```

**Login guru gagal setelah sync SDMS**
```bash
# Pastikan username = NIP (angka saja)
# Test login manual via curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"196501011990031002","password":"196501011990031002"}'
```

**Profil guru tidak tersimpan setelah refresh**
```bash
# Pastikan tabel profils sudah ada
mysql -u ejournal_user -p ejournal_smk -e "DESCRIBE profils;"

# Jika belum, jalankan migrate ulang
node src/database/migrate.js
```

**Data siswa tidak muncul di panel guru**
```bash
# Cek apakah kolom password sudah ada di tabel siswas
mysql -u ejournal_user -p ejournal_smk -e "SHOW COLUMNS FROM siswas LIKE 'password';"

# Jika belum, tambah kolom
node src/database/migrate.js
```

---

## Changelog

### v2.0.0 (September 2026)
- 🔄 **Migrasi database: MongoDB → MariaDB/MySQL**
- 🔄 **ORM: Mongoose → Sequelize 6**
- ✅ Struktur proyek direbuild total (`src/` dengan layer yang jelas)
- ✅ Sinkronisasi data dari SDMS (guru, siswa, kelas)
- ✅ Username guru = NIP, password = NIP
- ✅ Portal siswa: login NISN + password, ganti password
- ✅ Profil guru tersimpan ke database (persisten)
- ✅ Rekap absensi gabungan (AbsensiHarian + Absensi mapel)
- ✅ Script instalasi Ubuntu 24 LTS
- ✅ PM2 ecosystem config
- ✅ Security: helmet, rate limiting, JWT token cache

### v1.x (sebelumnya)
- MongoDB + Mongoose
- Struktur file flat di root

---

## Kontribusi

1. Fork repository
2. Buat branch: `git checkout -b feature/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi fitur"`
4. Push: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## Lisensi

MIT — bebas digunakan dan dimodifikasi untuk keperluan pendidikan dan sekolah.

---

*Dikembangkan untuk SMKN 1 Kras — E-Journal Digital Guru v2.0*
