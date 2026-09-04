'use strict';

const { sequelize } = require('../config/database');

// ─── Import semua model ────────────────────────────────────────────────────────
const Guru          = require('./Guru');
const Kelas         = require('./Kelas');
const Siswa         = require('./Siswa');
const MappingMapel  = require('./MappingMapel');
const GuruKelas     = require('./GuruKelas');
const Absensi       = require('./Absensi');
const AbsensiHarian = require('./AbsensiHarian');
const Nilai         = require('./Nilai');
const Sikap         = require('./Sikap');
const Jurnal        = require('./Jurnal');
const Jadwal        = require('./Jadwal');
const MindMap       = require('./MindMap');
const PengabsenKelas= require('./PengabsenKelas');
const Profil        = require('./Profil');
const Config        = require('./Config');
const LoginLog      = require('./LoginLog');
const AppSetting    = require('./AppSetting');

// ─── Relasi ───────────────────────────────────────────────────────────────────

// Guru → banyak relasi
Guru.hasMany(Kelas,          { foreignKey: 'guruId', as: 'kelasList', onDelete: 'SET NULL' });
Guru.hasMany(Siswa,          { foreignKey: 'guruId', as: 'siswaList', onDelete: 'SET NULL' });
Guru.hasMany(GuruKelas,      { foreignKey: 'guruId', as: 'guruKelasList', onDelete: 'CASCADE' });
Guru.hasMany(MappingMapel,   { foreignKey: 'guruId', as: 'mapelList', onDelete: 'CASCADE' });
Guru.hasMany(Absensi,        { foreignKey: 'guruId', as: 'absensiList', onDelete: 'CASCADE' });
Guru.hasMany(AbsensiHarian,  { foreignKey: 'guruId', as: 'absensiHarianList', onDelete: 'CASCADE' });
Guru.hasMany(Nilai,          { foreignKey: 'guruId', as: 'nilaiList', onDelete: 'CASCADE' });
Guru.hasMany(Sikap,          { foreignKey: 'guruId', as: 'sikapList', onDelete: 'CASCADE' });
Guru.hasMany(Jurnal,         { foreignKey: 'guruId', as: 'jurnalList', onDelete: 'CASCADE' });
Guru.hasMany(Jadwal,         { foreignKey: 'guruId', as: 'jadwalList', onDelete: 'CASCADE' });
Guru.hasMany(MindMap,        { foreignKey: 'guruId', as: 'mindmapList', onDelete: 'CASCADE' });
Guru.hasMany(PengabsenKelas, { foreignKey: 'guruId', as: 'pengabsenList', onDelete: 'CASCADE' });
Guru.hasMany(LoginLog,       { foreignKey: 'guruId', as: 'loginLogs', onDelete: 'CASCADE' });
Guru.hasMany(Config,         { foreignKey: 'guruId', as: 'configs', onDelete: 'CASCADE' });
Guru.hasOne (Profil,         { foreignKey: 'guruId', as: 'profil', onDelete: 'CASCADE' });

// Kelas → banyak relasi
Kelas.belongsTo(Guru,        { foreignKey: 'guruId', as: 'guru' });
Kelas.hasMany(Siswa,         { foreignKey: 'kelasId', as: 'siswaList', onDelete: 'SET NULL' });
Kelas.hasMany(GuruKelas,     { foreignKey: 'kelasId', as: 'guruKelasList', onDelete: 'CASCADE' });

// Siswa
// Gunakan as: 'kelasRef' karena kolom 'kelas' (string) sudah ada di model Siswa
Siswa.belongsTo(Guru,        { foreignKey: 'guruId',   as: 'guru' });
Siswa.belongsTo(Kelas,       { foreignKey: 'kelasId',  as: 'kelasRef' });
Siswa.hasMany(Absensi,       { foreignKey: 'siswaId',  as: 'absensiList',      onDelete: 'CASCADE' });
Siswa.hasMany(AbsensiHarian, { foreignKey: 'siswaId',  as: 'absensiHarianList',onDelete: 'CASCADE' });
Siswa.hasMany(Nilai,         { foreignKey: 'siswaId',  as: 'nilaiList',        onDelete: 'CASCADE' });
Siswa.hasMany(Sikap,         { foreignKey: 'siswaId',  as: 'sikapList',        onDelete: 'CASCADE' });

// GuruKelas
// Gunakan as: 'kelasRef' karena kolom di GuruKelas juga bisa bentrok
GuruKelas.belongsTo(Guru,        { foreignKey: 'guruId',         as: 'guru' });
GuruKelas.belongsTo(Kelas,       { foreignKey: 'kelasId',        as: 'kelasRef' });
GuruKelas.belongsTo(MappingMapel,{ foreignKey: 'mappingMapelId', as: 'mappingMapel' });

// MappingMapel
MappingMapel.belongsTo(Guru,    { foreignKey: 'guruId', as: 'guru' });
MappingMapel.hasMany(GuruKelas, { foreignKey: 'mappingMapelId', as: 'guruKelasList', onDelete: 'CASCADE' });

// Absensi
Absensi.belongsTo(Guru,         { foreignKey: 'guruId', as: 'guru' });
Absensi.belongsTo(Siswa,        { foreignKey: 'siswaId', as: 'siswa' });

// AbsensiHarian
AbsensiHarian.belongsTo(Guru,         { foreignKey: 'guruId', as: 'guru' });
AbsensiHarian.belongsTo(Siswa,        { foreignKey: 'siswaId', as: 'siswa' });
AbsensiHarian.belongsTo(PengabsenKelas,{ foreignKey: 'pengabsenId', as: 'pengabsen' });

// Nilai
Nilai.belongsTo(Guru,   { foreignKey: 'guruId', as: 'guru' });
Nilai.belongsTo(Siswa,  { foreignKey: 'siswaId', as: 'siswa' });

// Sikap
Sikap.belongsTo(Guru,   { foreignKey: 'guruId', as: 'guru' });
Sikap.belongsTo(Siswa,  { foreignKey: 'siswaId', as: 'siswa' });

// Jurnal
Jurnal.belongsTo(Guru,  { foreignKey: 'guruId', as: 'guru' });

// Jadwal
Jadwal.belongsTo(Guru,  { foreignKey: 'guruId', as: 'guru' });

// MindMap
MindMap.belongsTo(Guru, { foreignKey: 'guruId', as: 'guru' });

// PengabsenKelas
PengabsenKelas.belongsTo(Guru,          { foreignKey: 'guruId', as: 'guru' });
PengabsenKelas.hasMany(AbsensiHarian,   { foreignKey: 'pengabsenId', as: 'absensiHarianList', onDelete: 'SET NULL' });

// Profil
Profil.belongsTo(Guru,  { foreignKey: 'guruId', as: 'guru' });

// Config
Config.belongsTo(Guru,  { foreignKey: 'guruId', as: 'guru' });

// LoginLog
LoginLog.belongsTo(Guru, { foreignKey: 'guruId', as: 'guru' });

module.exports = {
  sequelize,
  Guru, Kelas, Siswa, MappingMapel, GuruKelas,
  Absensi, AbsensiHarian, Nilai, Sikap,
  Jurnal, Jadwal, MindMap, PengabsenKelas,
  Profil, Config, LoginLog, AppSetting,
};
