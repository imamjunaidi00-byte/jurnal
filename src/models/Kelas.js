'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Kelas extends Model {}

Kelas.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    // NULL = data global (admin-managed); isi = data lama per-guru
    guruId: {
      type:       DataTypes.INTEGER.UNSIGNED,
      allowNull:  true,
      defaultValue: null,
    },
    nama: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      set(val) { this.setDataValue('nama', val?.trim()); },
    },
    tingkat: {
      type:         DataTypes.TINYINT.UNSIGNED,
      allowNull:    false,
      // 10, 11, 12
      validate: { isIn: [[10, 11, 12]] },
    },
    jurusan: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      set(val) { this.setDataValue('jurusan', val?.trim()); },
    },
    rombel: {
      type:         DataTypes.STRING(20),
      defaultValue: '1',
    },
    waliKelas: {
      type:         DataTypes.STRING(100),
      defaultValue: '',
    },
    tahunAjaran: {
      type:      DataTypes.STRING(20),
      allowNull: false,
    },
    jumlahSiswa: {
      type:         DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName:  'Kelas',
    tableName:  'kelas',
    timestamps: true,
    indexes: [
      // Unique untuk data global (guruId IS NULL): nama + tahunAjaran
      // Unique untuk data per-guru: guruId + nama
      // Dihandle di application layer + constraint SQL di migration
    ],
  }
);

module.exports = Kelas;
