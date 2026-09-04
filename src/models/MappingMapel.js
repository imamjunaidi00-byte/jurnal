'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class MappingMapel extends Model {}

MappingMapel.init(
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
    nama: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      set(val) { this.setDataValue('nama', val?.trim()); },
    },
    kode: {
      type:         DataTypes.STRING(30),
      defaultValue: '',
    },
    deskripsi: {
      type:         DataTypes.TEXT,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName:  'MappingMapel',
    tableName:  'mapping_mapels',
    timestamps: true,
    indexes: [
      { fields: ['guruId'] },
    ],
  }
);

module.exports = MappingMapel;
