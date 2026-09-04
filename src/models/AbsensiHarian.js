'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AbsensiHarian extends Model {}

AbsensiHarian.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    guruId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment:   'ID wali kelas yang mengelola',
    },
    siswaId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    pengabsenId: {
      type:         DataTypes.INTEGER.UNSIGNED,
      allowNull:    true,
      defaultValue: null,
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
    diinputOleh: {
      type:         DataTypes.STRING(100),
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName:  'AbsensiHarian',
    tableName:  'absensi_harians',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['guruId', 'siswaId', 'tanggal', 'kelas'],
        name:   'uq_absensi_harian',
      },
      { fields: ['guruId', 'kelas', 'tanggal'] },
      { fields: ['guruId', 'kelas', 'semester', 'tahunAjaran'] },
    ],
  }
);

module.exports = AbsensiHarian;
