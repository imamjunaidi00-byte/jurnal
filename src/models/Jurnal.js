'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Jurnal extends Model {}

Jurnal.init(
  {
    id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tanggal:       { type: DataTypes.DATEONLY,          allowNull: false },
    hari:          { type: DataTypes.STRING(10),        allowNull: false },
    jamMulai:      { type: DataTypes.STRING(8),         allowNull: false },
    jamSelesai:    { type: DataTypes.STRING(8),         allowNull: false },
    mataPelajaran: { type: DataTypes.STRING(150),       allowNull: false },
    kelas:         { type: DataTypes.STRING(100),       allowNull: false },
    ruangan:       { type: DataTypes.STRING(50),        defaultValue: '' },
    guru:          { type: DataTypes.STRING(100),       allowNull: false, comment: 'Nama guru (denormalized)' },
    semester:      { type: DataTypes.ENUM('Ganjil','Genap'), defaultValue: 'Ganjil' },
    tahunAjaran:   { type: DataTypes.STRING(20),        defaultValue: '' },
    materiPokok:        { type: DataTypes.TEXT,    defaultValue: '' },
    kegiatanPembelajaran:{ type: DataTypes.TEXT,   defaultValue: '' },
    metodePembelajaran: { type: DataTypes.STRING(100), defaultValue: 'Ceramah' },
    mediaPembelajaran:  { type: DataTypes.TEXT,    defaultValue: '' },
    hasilPembelajaran:  { type: DataTypes.TEXT,    defaultValue: '' },
    jumlahHadir:     { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahSakit:     { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahIzin:      { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahAlpha:     { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahDispensasi:{ type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahPulangCepat:{ type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    jumlahSiswa:     { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    catatan: { type: DataTypes.TEXT, defaultValue: '' },
    status:  { type: DataTypes.ENUM('draft','selesai'), defaultValue: 'draft' },
  },
  {
    sequelize,
    modelName:  'Jurnal',
    tableName:  'jurnals',
    timestamps: true,
    indexes: [
      { fields: ['guruId','tahunAjaran','semester'] },
      { fields: ['guruId','tanggal'] },
    ],
  }
);

module.exports = Jurnal;
