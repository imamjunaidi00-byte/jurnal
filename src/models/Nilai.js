'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

// Hitung nilai turunan
function hitungNilai(instance) {
  let nilaiAkhir = 0;
  
  // Coba parse tpList (Tujuan Pembelajaran) — sistem baru
  try {
    const tpList = typeof instance.tpList === 'string' ? JSON.parse(instance.tpList) : (instance.tpList || []);
    if (Array.isArray(tpList) && tpList.length > 0) {
      // Hitung rata-rata nilai TP
      const totalTP = tpList.reduce((sum, tp) => sum + (Number(tp.nilai) || 0), 0);
      nilaiAkhir = Math.round(totalTP / tpList.length);
    }
  } catch(e) {}

  // Jika tidak ada tpList atau kosong, fallback ke sistem lama (UH, PTS, PAS)
  if (nilaiAkhir === 0) {
    const uh  = Number(instance.uh  || 0);
    const pts = Number(instance.pts || 0);
    const pas = Number(instance.pas || 0);
    nilaiAkhir = Math.round((uh * 0.2) + (pts * 0.3) + (pas * 0.5));
  }

  // Keterampilan tetap sama (Praktek + Proyek + Portofolio)
  const praktek    = Number(instance.praktek    || 0);
  const proyek     = Number(instance.proyek     || 0);
  const portofolio = Number(instance.portofolio || 0);
  const naKeterampilan = Math.round((praktek + proyek + portofolio) / 3);

  // NA Akhir = 60% nilaiAkhir (dari TP atau UH) + 40% keterampilan
  const naAkhir = Math.round((nilaiAkhir * 0.6) + (naKeterampilan * 0.4));

  // Predikat baru sesuai e-Rapor SMK
  let predikat;
  if (naAkhir >= 90)      predikat = 'A';
  else if (naAkhir >= 80) predikat = 'B';
  else if (naAkhir >= 70) predikat = 'C';
  else if (naAkhir >= 60) predikat = 'D';
  else                    predikat = 'E';

  instance.nilaiAkhir     = nilaiAkhir;
  instance.naPengetahuan  = nilaiAkhir;  // backward compat
  instance.naKeterampilan = naKeterampilan;
  instance.naAkhir        = naAkhir;
  instance.predikat       = predikat;
}

class Nilai extends Model {}

Nilai.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    guruId:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    siswaId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    kelas:        { type: DataTypes.STRING(100),       allowNull: false },
    semester:     { type: DataTypes.ENUM('Ganjil','Genap'), allowNull: false },
    tahunAjaran:  { type: DataTypes.STRING(20),        allowNull: false },
    mataPelajaran:{ type: DataTypes.STRING(150),       allowNull: false },
    guru:         { type: DataTypes.STRING(100),       allowNull: false, comment: 'Nama guru (denormalized)' },
    // Nilai Pengetahuan (backward compat — nullable agar data lama tidak rusak)
    uh:           { type: DataTypes.TINYINT.UNSIGNED,  allowNull: true, defaultValue: null },
    pts:          { type: DataTypes.TINYINT.UNSIGNED,  allowNull: true, defaultValue: null },
    pas:          { type: DataTypes.TINYINT.UNSIGNED,  allowNull: true, defaultValue: null },
    // Nilai Keterampilan (angka 0-100)
    praktek:      { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    proyek:       { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    portofolio:   { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    // Tujuan Pembelajaran — sistem nilai baru e-Rapor SMK
    tpList:       { type: DataTypes.TEXT, defaultValue: '[]', comment: 'JSON string array TP [{kode,deskripsi,nilai}]' },
    nilaiAkhir:   { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0, comment: 'Rata-rata nilai semua TP' },
    // Nilai Akhir (auto-computed)
    naPengetahuan:  { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    naKeterampilan: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    naAkhir:        { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    predikat:       { type: DataTypes.ENUM('A','B','C','D','E'), allowNull: true },
    deskripsi:      { type: DataTypes.TEXT, defaultValue: '' },
    // Detail nilai (backward compat — nullable)
    uhDetail:         { type: DataTypes.TEXT, allowNull: true, defaultValue: null, comment: 'Legacy: JSON string {UH1:"A",UH2:"B+"}' },
    praktekGrade:     { type: DataTypes.STRING(10), allowNull: true, defaultValue: null, comment: 'Legacy: nilai huruf praktek' },
    proyekGrade:      { type: DataTypes.STRING(10), allowNull: true, defaultValue: null, comment: 'Legacy: nilai huruf proyek' },
    portofolioGrade:  { type: DataTypes.STRING(10), allowNull: true, defaultValue: null, comment: 'Legacy: nilai huruf portofolio' },
    // Kontrol visibilitas ke portal siswa
    tampilkan: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName:  'Nilai',
    tableName:  'nilais',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['guruId','siswaId','semester','tahunAjaran','mataPelajaran'],
        name:   'uq_nilai',
      },
      { fields: ['guruId','kelas','semester','tahunAjaran'] },
    ],
    hooks: {
      beforeCreate: hitungNilai,
      beforeUpdate: hitungNilai,
    },
  }
);

module.exports = Nilai;
