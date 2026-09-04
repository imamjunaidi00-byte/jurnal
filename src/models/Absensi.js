'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Absensi extends Model {}

Absensi.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    guruId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    siswaId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    kelas: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    tanggal: {
      type:      DataTypes.DATEONLY,
      allowNull: false,
    },
    semester: {
      type:      DataTypes.ENUM('Ganjil', 'Genap'),
      allowNull: false,
    },
    tahunAjaran: {
      type:      DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type:         DataTypes.ENUM('hadir','sakit','izin','alpha','dispensasi','pulang_cepat'),
      defaultValue: 'hadir',
      allowNull:    false,
    },
    keterangan: {
      type:         DataTypes.TEXT,
      defaultValue: '',
    },
    jamMasuk: {
      type:         DataTypes.STRING(10),
      allowNull:    true,
      defaultValue: null,
    },
    jamPulang: {
      type:         DataTypes.STRING(10),
      allowNull:    true,
      defaultValue: null,
    },
    guruPengampu: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    mataPelajaran: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName:  'Absensi',
    tableName:  'absensis',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['guruId', 'siswaId', 'tanggal', 'mataPelajaran'],
        name:   'uq_absensi_mapel',
      },
      { fields: ['guruId', 'kelas', 'tanggal'] },
      { fields: ['guruId', 'kelas', 'semester', 'tahunAjaran'] },
    ],
  }
);

module.exports = Absensi;
