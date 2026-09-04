'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Jadwal extends Model {}

Jadwal.init(
  {
    id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hari:          { type: DataTypes.ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'), allowNull: false },
    jamMulai:      { type: DataTypes.STRING(8), allowNull: false },
    jamSelesai:    { type: DataTypes.STRING(8), allowNull: false },
    mataPelajaran: { type: DataTypes.STRING(150), allowNull: false },
    kelas:         { type: DataTypes.STRING(100), allowNull: false },
    guru:          { type: DataTypes.STRING(100), allowNull: false, comment: 'Nama guru (denormalized)' },
    ruangan:       { type: DataTypes.STRING(50),  allowNull: false },
    semester:      { type: DataTypes.ENUM('Ganjil','Genap'), allowNull: false },
    tahunAjaran:   { type: DataTypes.STRING(20),  allowNull: false },
    aktif:         { type: DataTypes.BOOLEAN, defaultValue: true },
    catatan:       { type: DataTypes.TEXT,    defaultValue: '' },
  },
  {
    sequelize,
    modelName:  'Jadwal',
    tableName:  'jadwals',
    timestamps: true,
    indexes: [
      { fields: ['guruId','tahunAjaran','semester'] },
      { fields: ['guruId','aktif'] },
    ],
  }
);

module.exports = Jadwal;
