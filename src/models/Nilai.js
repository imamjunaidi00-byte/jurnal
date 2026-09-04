'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

// Hitung nilai turunan
function hitungNilai(instance) {
  const uh  = Number(instance.uh  || 0);
  const pts = Number(instance.pts || 0);
  const pas = Number(instance.pas || 0);

  const naPengetahuan = Math.round((uh * 0.2) + (pts * 0.3) + (pas * 0.5));

  const praktek    = Number(instance.praktek    || 0);
  const proyek     = Number(instance.proyek     || 0);
  const portofolio = Number(instance.portofolio || 0);
  const naKeterampilan = Math.round((praktek + proyek + portofolio) / 3);

  const naAkhir = Math.round((naPengetahuan * 0.6) + (naKeterampilan * 0.4));

  let predikat;
  if (naAkhir >= 85)      predikat = 'A';
  else if (naAkhir >= 75) predikat = 'B';
  else if (naAkhir >= 65) predikat = 'C';
  else if (naAkhir >= 50) predikat = 'D';
  else                    predikat = 'E';

  instance.naPengetahuan  = naPengetahuan;
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
    // Nilai Pengetahuan
    uh:           { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    pts:          { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    pas:          { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    // Nilai Keterampilan
    praktek:      { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    proyek:       { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    portofolio:   { type: DataTypes.TINYINT.UNSIGNED,  defaultValue: 0 },
    // Nilai Akhir (auto-computed)
    naPengetahuan:  { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    naKeterampilan: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    naAkhir:        { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    predikat:       { type: DataTypes.ENUM('A','B','C','D','E'), allowNull: true },
    deskripsi:      { type: DataTypes.TEXT, defaultValue: '' },
    // Detail nilai huruf
    uhDetail:         { type: DataTypes.TEXT, defaultValue: '', comment: 'JSON string {UH1:"A",UH2:"B+"}' },
    praktekGrade:     { type: DataTypes.STRING(10), defaultValue: '' },
    proyekGrade:      { type: DataTypes.STRING(10), defaultValue: '' },
    portofolioGrade:  { type: DataTypes.STRING(10), defaultValue: '' },
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
