-- ============================================================
-- E-Journal SMK — Schema MariaDB / MySQL
-- Versi  : 2.0.0
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- Gunakan file ini sebagai referensi DDL manual.
-- Untuk setup otomatis gunakan: node src/database/migrate.js
-- ============================================================

CREATE DATABASE IF NOT EXISTS `ejournal_smk`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ejournal_smk`;

-- ─── GURUS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `gurus` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`    VARCHAR(80)     NOT NULL,
  `password`    VARCHAR(255)    NOT NULL,
  `nama`        VARCHAR(100)    NOT NULL,
  `role`        ENUM('guru','admin') NOT NULL DEFAULT 'guru',
  `isWaliKelas` TINYINT(1)      NOT NULL DEFAULT 0,
  `kelasWali`   VARCHAR(100)    NOT NULL DEFAULT '',
  `createdAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_guru_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── KELAS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `kelas` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`      INT UNSIGNED    DEFAULT NULL,
  `nama`        VARCHAR(100)    NOT NULL,
  `tingkat`     TINYINT UNSIGNED NOT NULL,
  `jurusan`     VARCHAR(100)    NOT NULL,
  `rombel`      VARCHAR(20)     NOT NULL DEFAULT '1',
  `waliKelas`   VARCHAR(100)    NOT NULL DEFAULT '',
  `tahunAjaran` VARCHAR(20)     NOT NULL,
  `jumlahSiswa` INT UNSIGNED    NOT NULL DEFAULT 0,
  `createdAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kelas_guruId`      (`guruId`),
  KEY `idx_kelas_tahunAjaran` (`tahunAjaran`),
  CONSTRAINT `fk_kelas_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── SISWAS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `siswas` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`          INT UNSIGNED    DEFAULT NULL,
  `kelasId`         INT UNSIGNED    DEFAULT NULL,
  `nama`            VARCHAR(100)    NOT NULL,
  `nisn`            VARCHAR(20)     NOT NULL,
  `nis`             VARCHAR(20)     DEFAULT NULL,
  `kelas`           VARCHAR(100)    DEFAULT NULL,
  `jenisKelamin`    ENUM('L','P')   NOT NULL,
  `tempatLahir`     VARCHAR(100)    DEFAULT NULL,
  `tanggalLahir`    DATE            DEFAULT NULL,
  `agama`           ENUM('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya') DEFAULT NULL,
  `alamat`          TEXT            DEFAULT NULL,
  `namaAyah`        VARCHAR(100)    DEFAULT NULL,
  `namaIbu`         VARCHAR(100)    DEFAULT NULL,
  `telpOrtu`        VARCHAR(20)     DEFAULT NULL,
  `noHp`            VARCHAR(20)     DEFAULT NULL,
  `tahunMasuk`      SMALLINT UNSIGNED DEFAULT NULL,
  `penerimaBantuan` ENUM('Tidak','PIP','KIP','BSM','PKH','Lainnya') NOT NULL DEFAULT 'Tidak',
  `status`          ENUM('Aktif','Nonaktif','Lulus','Keluar') NOT NULL DEFAULT 'Aktif',
  `foto`            TEXT            DEFAULT NULL,
  `createdAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_siswa_nisn` (`nisn`),
  UNIQUE KEY `uq_siswa_nis`  (`nis`),
  KEY `idx_siswa_guruId`       (`guruId`),
  KEY `idx_siswa_kelasId`      (`kelasId`),
  KEY `idx_siswa_kelas_status` (`kelas`(50), `status`),
  CONSTRAINT `fk_siswa_guru`  FOREIGN KEY (`guruId`)  REFERENCES `gurus`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_siswa_kelas` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE SET NULL,
  FULLTEXT KEY `ft_siswa_nama_nisn` (`nama`, `nisn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── MAPPING_MAPELS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `mapping_mapels` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`    INT UNSIGNED NOT NULL,
  `nama`      VARCHAR(150) NOT NULL,
  `kode`      VARCHAR(30)  NOT NULL DEFAULT '',
  `deskripsi` TEXT         NOT NULL DEFAULT '',
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mapel_guruId` (`guruId`),
  CONSTRAINT `fk_mapel_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── GURU_KELAS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `guru_kelas` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`          INT UNSIGNED    NOT NULL,
  `kelasId`         INT UNSIGNED    NOT NULL,
  `mappingMapelId`  INT UNSIGNED    NOT NULL,
  `mapelNama`       VARCHAR(150)    NOT NULL,
  `mapelKode`       VARCHAR(30)     NOT NULL DEFAULT '',
  `tahunAjaran`     VARCHAR(20)     NOT NULL,
  `semester`        ENUM('Ganjil','Genap') NOT NULL,
  `aktif`           TINYINT(1)      NOT NULL DEFAULT 1,
  `createdAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_guru_kelas_mapel` (`guruId`,`kelasId`,`mappingMapelId`,`tahunAjaran`,`semester`),
  KEY `idx_gk_guru_ta_sem`  (`guruId`,`tahunAjaran`,`semester`),
  KEY `idx_gk_guru_aktif`   (`guruId`,`aktif`),
  KEY `idx_gk_kelasId`      (`kelasId`),
  KEY `idx_gk_mapelId`      (`mappingMapelId`),
  CONSTRAINT `fk_gk_guru`   FOREIGN KEY (`guruId`)         REFERENCES `gurus`(`id`)          ON DELETE CASCADE,
  CONSTRAINT `fk_gk_kelas`  FOREIGN KEY (`kelasId`)        REFERENCES `kelas`(`id`)           ON DELETE CASCADE,
  CONSTRAINT `fk_gk_mapel`  FOREIGN KEY (`mappingMapelId`) REFERENCES `mapping_mapels`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ABSENSIS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `absensis` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`        INT UNSIGNED    NOT NULL,
  `siswaId`       INT UNSIGNED    NOT NULL,
  `kelas`         VARCHAR(100)    NOT NULL,
  `tanggal`       DATE            NOT NULL,
  `semester`      ENUM('Ganjil','Genap') NOT NULL,
  `tahunAjaran`   VARCHAR(20)     NOT NULL,
  `status`        ENUM('hadir','sakit','izin','alpha','dispensasi','pulang_cepat') NOT NULL DEFAULT 'hadir',
  `keterangan`    TEXT            NOT NULL DEFAULT '',
  `jamMasuk`      VARCHAR(10)     DEFAULT NULL,
  `jamPulang`     VARCHAR(10)     DEFAULT NULL,
  `guruPengampu`  VARCHAR(100)    NOT NULL,
  `mataPelajaran` VARCHAR(150)    NOT NULL,
  `createdAt`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_absensi_mapel` (`guruId`,`siswaId`,`tanggal`,`mataPelajaran`),
  KEY `idx_abs_kelas_tgl`       (`guruId`,`kelas`(50),`tanggal`),
  KEY `idx_abs_kelas_sem`       (`guruId`,`kelas`(50),`semester`,`tahunAjaran`),
  KEY `idx_abs_siswaId`         (`siswaId`),
  CONSTRAINT `fk_abs_guru`  FOREIGN KEY (`guruId`)  REFERENCES `gurus`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_abs_siswa` FOREIGN KEY (`siswaId`) REFERENCES `siswas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ABSENSI_HARIANS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `absensi_harians` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`      INT UNSIGNED    NOT NULL,
  `siswaId`     INT UNSIGNED    NOT NULL,
  `pengabsenId` INT UNSIGNED    DEFAULT NULL,
  `kelas`       VARCHAR(100)    NOT NULL,
  `tanggal`     DATE            NOT NULL,
  `semester`    ENUM('Ganjil','Genap') NOT NULL,
  `tahunAjaran` VARCHAR(20)     NOT NULL,
  `status`      ENUM('hadir','sakit','izin','alpha','dispensasi','pulang_cepat') NOT NULL DEFAULT 'hadir',
  `keterangan`  TEXT            NOT NULL DEFAULT '',
  `diinputOleh` VARCHAR(100)    NOT NULL DEFAULT '',
  `createdAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_absensi_harian` (`guruId`,`siswaId`,`tanggal`,`kelas`(50)),
  KEY `idx_ah_kelas_tgl`  (`guruId`,`kelas`(50),`tanggal`),
  KEY `idx_ah_kelas_sem`  (`guruId`,`kelas`(50),`semester`,`tahunAjaran`),
  KEY `idx_ah_siswaId`    (`siswaId`),
  KEY `idx_ah_pengabsen`  (`pengabsenId`),
  CONSTRAINT `fk_ah_guru`      FOREIGN KEY (`guruId`)      REFERENCES `gurus`(`id`)           ON DELETE CASCADE,
  CONSTRAINT `fk_ah_siswa`     FOREIGN KEY (`siswaId`)     REFERENCES `siswas`(`id`)          ON DELETE CASCADE,
  CONSTRAINT `fk_ah_pengabsen` FOREIGN KEY (`pengabsenId`) REFERENCES `pengabsen_kelas`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── NILAIS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `nilais` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `guruId`          INT UNSIGNED    NOT NULL,
  `siswaId`         INT UNSIGNED    NOT NULL,
  `kelas`           VARCHAR(100)    NOT NULL,
  `semester`        ENUM('Ganjil','Genap') NOT NULL,
  `tahunAjaran`     VARCHAR(20)     NOT NULL,
  `mataPelajaran`   VARCHAR(150)    NOT NULL,
  `guru`            VARCHAR(100)    NOT NULL,
  `uh`              TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `pts`             TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `pas`             TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `praktek`         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `proyek`          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `portofolio`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `naPengetahuan`   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `naKeterampilan`  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `naAkhir`         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `predikat`        ENUM('A','B','C','D','E') DEFAULT NULL,
  `deskripsi`       TEXT            NOT NULL DEFAULT '',
  `uhDetail`        TEXT            NOT NULL DEFAULT '',
  `praktekGrade`    VARCHAR(10)     NOT NULL DEFAULT '',
  `proyekGrade`     VARCHAR(10)     NOT NULL DEFAULT '',
  `portofolioGrade` VARCHAR(10)     NOT NULL DEFAULT '',
  `tampilkan`       TINYINT(1)      NOT NULL DEFAULT 0,
  `createdAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nilai` (`guruId`,`siswaId`,`semester`,`tahunAjaran`,`mataPelajaran`),
  KEY `idx_nilai_kelas`   (`guruId`,`kelas`(50),`semester`,`tahunAjaran`),
  KEY `idx_nilai_siswaId` (`siswaId`),
  CONSTRAINT `fk_nilai_guru`  FOREIGN KEY (`guruId`)  REFERENCES `gurus`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_nilai_siswa` FOREIGN KEY (`siswaId`) REFERENCES `siswas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── SIKAPS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sikaps` (
  `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `guruId`              INT UNSIGNED  NOT NULL,
  `siswaId`             INT UNSIGNED  NOT NULL,
  `kelas`               VARCHAR(100)  NOT NULL,
  `semester`            ENUM('Ganjil','Genap') NOT NULL,
  `tahunAjaran`         VARCHAR(20)   NOT NULL,
  `berdoa`              ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `toleransi`           ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `bersyukur`           ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `jujur`               ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `disiplin`            ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `tanggungJawab`       ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `santun`              ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `peduli`              ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `percayaDiri`         ENUM('SB','B','C','K') NOT NULL DEFAULT 'B',
  `nilaiSpiritual`      ENUM('SB','B','C','K') DEFAULT NULL,
  `nilaiSosial`         ENUM('SB','B','C','K') DEFAULT NULL,
  `deskripsiSpiritual`  TEXT          NOT NULL DEFAULT '',
  `deskripsiSosial`     TEXT          NOT NULL DEFAULT '',
  `createdAt`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sikap` (`guruId`,`siswaId`,`semester`,`tahunAjaran`),
  KEY `idx_sikap_kelas` (`guruId`,`kelas`(50),`semester`,`tahunAjaran`),
  KEY `idx_sikap_siswa` (`siswaId`),
  CONSTRAINT `fk_sikap_guru`  FOREIGN KEY (`guruId`)  REFERENCES `gurus`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_sikap_siswa` FOREIGN KEY (`siswaId`) REFERENCES `siswas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── JURNALS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `jurnals` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`                INT UNSIGNED NOT NULL,
  `tanggal`               DATE         NOT NULL,
  `hari`                  VARCHAR(10)  NOT NULL,
  `jamMulai`              VARCHAR(8)   NOT NULL,
  `jamSelesai`            VARCHAR(8)   NOT NULL,
  `mataPelajaran`         VARCHAR(150) NOT NULL,
  `kelas`                 VARCHAR(100) NOT NULL,
  `ruangan`               VARCHAR(50)  NOT NULL DEFAULT '',
  `guru`                  VARCHAR(100) NOT NULL,
  `semester`              ENUM('Ganjil','Genap') NOT NULL DEFAULT 'Ganjil',
  `tahunAjaran`           VARCHAR(20)  NOT NULL DEFAULT '',
  `materiPokok`           TEXT         NOT NULL DEFAULT '',
  `kegiatanPembelajaran`  TEXT         NOT NULL DEFAULT '',
  `metodePembelajaran`    VARCHAR(100) NOT NULL DEFAULT 'Ceramah',
  `mediaPembelajaran`     TEXT         NOT NULL DEFAULT '',
  `hasilPembelajaran`     TEXT         NOT NULL DEFAULT '',
  `jumlahHadir`           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahSakit`           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahIzin`            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahAlpha`           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahDispensasi`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahPulangCepat`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `jumlahSiswa`           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `catatan`               TEXT         NOT NULL DEFAULT '',
  `status`                ENUM('draft','selesai') NOT NULL DEFAULT 'draft',
  `createdAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jurnal_ta_sem` (`guruId`,`tahunAjaran`,`semester`),
  KEY `idx_jurnal_tgl`    (`guruId`,`tanggal`),
  CONSTRAINT `fk_jurnal_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── JADWALS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `jadwals` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`        INT UNSIGNED NOT NULL,
  `hari`          ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
  `jamMulai`      VARCHAR(8)   NOT NULL,
  `jamSelesai`    VARCHAR(8)   NOT NULL,
  `mataPelajaran` VARCHAR(150) NOT NULL,
  `kelas`         VARCHAR(100) NOT NULL,
  `guru`          VARCHAR(100) NOT NULL,
  `ruangan`       VARCHAR(50)  NOT NULL,
  `semester`      ENUM('Ganjil','Genap') NOT NULL,
  `tahunAjaran`   VARCHAR(20)  NOT NULL,
  `aktif`         TINYINT(1)   NOT NULL DEFAULT 1,
  `catatan`       TEXT         NOT NULL DEFAULT '',
  `createdAt`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jadwal_ta_sem` (`guruId`,`tahunAjaran`,`semester`),
  KEY `idx_jadwal_aktif`  (`guruId`,`aktif`),
  CONSTRAINT `fk_jadwal_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── MINDMAPS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `mindmaps` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`        INT UNSIGNED NOT NULL,
  `judul`         VARCHAR(200) NOT NULL,
  `mataPelajaran` VARCHAR(150) NOT NULL DEFAULT '',
  `kelas`         VARCHAR(100) NOT NULL DEFAULT '',
  `deskripsi`     TEXT         NOT NULL DEFAULT '',
  `guru`          VARCHAR(100) NOT NULL DEFAULT '',
  `nodes`         JSON         NOT NULL,
  `warna`         VARCHAR(20)  NOT NULL DEFAULT '#3b82f6',
  `createdAt`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mm_guruId`      (`guruId`),
  KEY `idx_mm_guru_kelas`  (`guruId`,`kelas`(50)),
  CONSTRAINT `fk_mm_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── PENGABSEN_KELAS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pengabsen_kelas` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`    INT UNSIGNED NOT NULL,
  `username`  VARCHAR(80)  NOT NULL,
  `password`  VARCHAR(255) NOT NULL,
  `nama`      VARCHAR(100) NOT NULL,
  `kelas`     VARCHAR(100) NOT NULL,
  `aktif`     TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pengabsen_username` (`username`),
  KEY `idx_pengabsen_guruId` (`guruId`),
  CONSTRAINT `fk_pengabsen_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── PROFILS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `profils` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`            INT UNSIGNED NOT NULL,
  `namaGuru`          VARCHAR(100) NOT NULL DEFAULT '',
  `mapelGuru`         JSON         NOT NULL,
  `fotoGuru`          TEXT         NOT NULL DEFAULT '',
  `kelasList`         JSON         NOT NULL,
  `kelasMapelMapping` JSON         NOT NULL,
  `semester`          ENUM('Ganjil','Genap') NOT NULL DEFAULT 'Ganjil',
  `tahunAjaran`       VARCHAR(20)  NOT NULL DEFAULT '',
  `bobotPengetahuan`  TINYINT UNSIGNED NOT NULL DEFAULT 60,
  `bobotKeterampilan` TINYINT UNSIGNED NOT NULL DEFAULT 40,
  `bobotKehadiran`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `appData`           JSON         NOT NULL,
  `createdAt`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profil_guruId` (`guruId`),
  CONSTRAINT `fk_profil_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CONFIGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `configs` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`    INT UNSIGNED NOT NULL,
  `key`       VARCHAR(80)  NOT NULL,
  `value`     JSON         NOT NULL,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_config` (`guruId`,`key`),
  CONSTRAINT `fk_config_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── LOGIN_LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guruId`    INT UNSIGNED NOT NULL,
  `username`  VARCHAR(80)  NOT NULL,
  `nama`      VARCHAR(100) NOT NULL DEFAULT '',
  `ip`        VARCHAR(50)  NOT NULL DEFAULT '',
  `userAgent` TEXT         NOT NULL DEFAULT '',
  `loginAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_guru_at` (`guruId`,`loginAt`),
  KEY `idx_log_at`      (`loginAt`),
  CONSTRAINT `fk_log_guru` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── APP_SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`       VARCHAR(80)  NOT NULL,
  `value`     JSON         NOT NULL,
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_setting_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Default data ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `app_settings` (`key`, `value`)
VALUES ('identity', '{"name":"E-Journal SMK","tagline":"Sistem Jurnal Digital Guru","logo":""}');
