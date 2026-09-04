'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class GuruKelas extends Model {}

GuruKelas.init(
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
    kelasId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    mappingMapelId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    mapelNama: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      comment:   'Denormalized dari MappingMapel.nama',
    },
    mapelKode: {
      type:         DataTypes.STRING(30),
      defaultValue: '',
    },
    tahunAjaran: {
      type:      DataTypes.STRING(20),
      allowNull: false,
    },
    semester: {
      type:      DataTypes.ENUM('Ganjil', 'Genap'),
      allowNull: false,
    },
    aktif: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName:  'GuruKelas',
    tableName:  'guru_kelas',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['guruId', 'kelasId', 'mappingMapelId', 'tahunAjaran', 'semester'],
        name:   'uq_guru_kelas_mapel',
      },
      { fields: ['guruId', 'tahunAjaran', 'semester'] },
      { fields: ['guruId', 'aktif'] },
      { fields: ['kelasId'] },
    ],
  }
);

module.exports = GuruKelas;
