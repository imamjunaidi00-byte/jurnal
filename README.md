# E-Journal SMK v2.0

Sistem Jurnal Mengajar Digital untuk SMK — dibangun dengan **Node.js**, **Express**, dan **MariaDB** (Sequelize ORM).

---

## Fitur Utama

- Manajemen guru & admin dengan JWT authentication
- Master data kelas dan siswa (import/export Excel)
- Absensi per mata pelajaran & absensi harian kelas
- Input nilai dengan perhitungan otomatis (NA Pengetahuan, Keterampilan, Akhir, Predikat)
- Penilaian sikap spiritual & sosial
- Jurnal mengajar harian
- Jadwal mengajar
- Mind Map materi pembelajaran
- Portal siswa (baca nilai, jadwal, absensi via NISN)
- Wali kelas + akun pengabsen kelas
- Dashboard admin: manajemen user, identitas aplikasi, log aktivitas

---

## Stack Teknologi

| Layer      | Teknologi                        |
|------------|----------------------------------|
| Runtime    | Node.js 20 LTS                   |
| Framework  | Express.js 4                     |
| Database   | MariaDB 10.6+ / MySQL 8+         |
| ORM        | Sequelize 6                      |
| Auth       | JWT (jsonwebtoken + bcryptjs)     |
| Process    | PM2                              |
| Web Server | Nginx (reverse proxy)            |
| OS Target  | Ubuntu 24.04 LTS                 |

---

## Struktur Proyek

```
ejournal-smk/
├── server.js                  # Entry point utama
├── ecosystem.config.js        # PM2 config
├── package.json
├── .env.example               # Template environment variables
├── install.sh                 # Script instalasi Ubuntu 24
├── setup-db.sh                # Script setup database saja
├── update.sh                  # Script update dari GitHub
│
├── src/
│   ├── config/
│   │   └── database.js        # Sequelize connection config
│   │
│   ├── models/
│   │   ├── index.js           # Model registry + relasi
│   │   ├── Guru.js            # User (guru & admin)
│   │   ├── Kelas.js           # Master kelas
│   │   ├── Siswa.js           # Master siswa
│   │   ├── MappingMapel.js    # Daftar mata pelajaran guru
│   │   ├── GuruKelas.js       # Relasi guru-kelas-mapel
│   │   ├── Absensi.js         # Absensi per mapel
│   │   ├── AbsensiHarian.js   # Absensi harian kelas
│   │   ├── Nilai.js           # Nilai akademik
│   │   ├── Sikap.js           # Penilaian sikap
│   │   ├── Jurnal.js          # Jurnal mengajar
│   │   ├── Jadwal.js          # Jadwal pelajaran
│   │   ├── MindMap.js         # Mind map materi
│   │   ├── PengabsenKelas.js  # Akun pengurus absensi
│   │   ├── Profil.js          # Profil & preferensi guru
│   │   ├── Config.js          # Konfigurasi per guru
│   │   ├── LoginLog.js        # Log aktivitas login
│   │   └── AppSetting.js      # Pengaturan global aplikasi
│   │
│   ├── controllers/           # Business logic per domain
│   ├── routes/                # Definisi endpoint REST API
│   ├── middleware/
│   │   ├── auth.js            # JWT protect/adminOnly/protectPengabsen
│   │   ├── upload.js          # Multer file upload
│   │   └── rateLimit.js       # In-memory rate limiter
│   │
│   ├── utils/
│   │   ├── response.js        # Standar response helper
│   │   ├── excel.js           # Read/write Excel (xlsx)
│   │   └── cache.js           # In-memory cache dengan TTL
│   │
│   └── database/
│       ├── migrate.js         # Sequelize sync (auto-create tables)
│       ├── seed.js            # Buat akun admin pertama
│       └── schema.sql         # DDL referensi manual
│
├── public/                    # Frontend static files (HTML/CSS/JS)
├── uploads/                   # File upload sementara
└── logs/                      # PM2 log files
```

---

## Instalasi Cepat — Ubuntu 24 LTS (Server Baru)

### 1. Siapkan server Ubuntu 24

```bash
# Login ke server sebagai root
ssh root@IP_SERVER
```

### 2. Clone repository

```bash
git clone https://github.com/USERNAME/REPO_NAME.git /var/www/ejournal
cd /var/www/ejournal
```

### 3. Jalankan script instalasi otomatis

Script ini akan menginstall: Node.js 20, MariaDB, Nginx, PM2, dan mengkonfigurasi firewall.

```bash
# Set variabel (opsional — jika tidak diset, pakai default)
export DB_PASS="password_database_aman"
export DOMAIN="ejurnal.sekolah.sch.id"   # atau _ untuk semua domain

sudo bash install.sh
```

Script akan menampilkan kredensial database di akhir — **simpan di tempat aman**.

### 4. Deploy aplikasi

```bash
cd /var/www/ejournal

# Install npm dependencies
npm install --production

# Jalankan migrasi database (buat semua tabel)
node src/database/migrate.js

# Buat akun admin pertama
node src/database/seed.js

# Start dengan PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Verifikasi

```bash
# Cek status PM2
pm2 status

# Cek log
pm2 logs ejournal-smk --lines 20

# Test endpoint health
curl http://localhost:3000/api/health
```

Aplikasi sekarang bisa diakses di `http://IP_SERVER` atau domain yang dikonfigurasi.

---

## Instalasi Manual (Langkah per Langkah)

### Prasyarat

- Ubuntu 24.04 LTS
- Node.js 18+ (disarankan 20 LTS)
- MariaDB 10.6+ atau MySQL 8+
- npm 9+

### Setup database

```sql
-- Login ke MariaDB
sudo mysql -u root

-- Buat database dan user
CREATE DATABASE ejournal_smk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ejournal_user'@'localhost' IDENTIFIED BY 'password_aman';
GRANT ALL PRIVILEGES ON ejournal_smk.* TO 'ejournal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Konfigurasi environment

```bash
cp .env.example .env
nano .env   # sesuaikan DB_HOST, DB_USER, DB_PASS, JWT_SECRET
```

### Install & jalankan

```bash
npm install
node src/database/migrate.js   # buat semua tabel
node src/database/seed.js      # buat admin pertama
npm start                      # atau: npm run dev (development)
```

---

## Setup GitHub (Repository Baru)

### Push ke GitHub pertama kali

```bash
cd /var/www/ejournal   # atau direktori lokal Anda

# Inisialisasi git (jika belum)
git init
git add .
git commit -m "feat: initial release v2.0 - MariaDB/Sequelize"

# Hubungkan ke repository GitHub baru
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### Update dari server

```bash
cd /var/www/ejournal
bash update.sh
```

Script `update.sh` otomatis melakukan: git pull → npm install → migrate → pm2 reload.

---

## API Endpoints

### Authentication
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Login guru/admin |
| POST | `/api/auth/register` | Registrasi (hanya jika belum ada admin) |
| GET | `/api/auth/me` | Info user saat ini |
| POST | `/api/auth/logout` | Logout |
| PUT | `/api/auth/password` | Ganti password |

### Admin
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/admin/guru` | Daftar semua guru |
| POST | `/api/admin/guru` | Buat akun guru |
| PUT | `/api/admin/guru/:id/edit` | Edit data guru |
| DELETE | `/api/admin/guru/:id` | Hapus guru + semua data |
| GET/PUT | `/api/admin/app-identity` | Identitas aplikasi |
| GET | `/api/admin/aktivitas` | Log aktivitas login |

### Master Data (Admin only)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET/POST | `/api/admin/kelas` | Kelola kelas |
| GET/POST | `/api/admin/siswa` | Kelola siswa |
| POST | `/api/admin/siswa/import` | Import siswa dari Excel |

### Guru (Token required)
| Prefix | Keterangan |
|--------|------------|
| `/api/absensi` | Absensi per mata pelajaran |
| `/api/nilai` | Input & rekap nilai |
| `/api/sikap` | Penilaian sikap |
| `/api/jurnal` | Jurnal mengajar |
| `/api/jadwal` | Jadwal pelajaran |
| `/api/mindmap` | Mind map materi |
| `/api/guru-kelas` | Penugasan kelas-mapel |
| `/api/mapping-mapel` | Daftar mata pelajaran |
| `/api/profil` | Profil & preferensi |
| `/api/config` | Semester aktif |

### Wali Kelas
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET/POST | `/api/wali-kelas/pengabsen` | Kelola akun pengabsen |
| GET | `/api/wali-kelas/absensi-harian` | Absensi harian kelas |
| POST | `/api/wali-kelas/pengabsen-login` | Login pengabsen |
| POST | `/api/wali-kelas/input-absensi` | Input absensi (pengabsen) |

### Portal Siswa (Public)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/siswa-portal/login` | Masuk via NISN + tgl lahir |
| GET | `/api/siswa-portal/nilai` | Lihat nilai yang dipublish |
| GET | `/api/siswa-portal/jadwal` | Jadwal kelas |
| GET | `/api/siswa-portal/absensi` | Rekap absensi |
| GET | `/api/siswa-portal/materi` | Mind map/materi |

---

## Konfigurasi SSL (HTTPS) dengan Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Dapatkan sertifikat SSL
sudo certbot --nginx -d ejurnal.sekolah.sch.id

# Auto-renew (sudah otomatis via systemd timer)
sudo certbot renew --dry-run
```

---

## Maintenance

### Backup database

```bash
# Backup
mysqldump -u ejournal_user -p ejournal_smk > backup_$(date +%Y%m%d).sql

# Restore
mysql -u ejournal_user -p ejournal_smk < backup_20250101.sql
```

### Reset database (hati-hati!)

```bash
node src/database/migrate.js --reset
node src/database/seed.js
```

### Lihat log aplikasi

```bash
pm2 logs ejournal-smk
pm2 logs ejournal-smk --lines 100 --err
```

### Monitor resource

```bash
pm2 monit
```

---

## Troubleshooting

**Aplikasi tidak bisa connect ke database**
```bash
# Cek MariaDB berjalan
sudo systemctl status mariadb

# Test koneksi manual
mysql -u ejournal_user -p ejournal_smk -e "SELECT 1"
```

**Port 3000 tidak bisa diakses**
```bash
# Cek PM2
pm2 status
pm2 restart ejournal-smk

# Cek port
ss -tlnp | grep 3000
```

**Error setelah update**
```bash
# Lihat log error
pm2 logs ejournal-smk --err --lines 50

# Reset dan install ulang dependencies
rm -rf node_modules
npm install --production
pm2 restart ejournal-smk
```

---

## Lisensi

MIT — bebas digunakan dan dimodifikasi untuk keperluan pendidikan.
