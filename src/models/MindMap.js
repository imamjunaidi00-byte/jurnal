'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class MindMap extends Model {}

MindMap.init(
  {
    id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    judul:         { type: DataTypes.STRING(200), allowNull: false },
    mataPelajaran: { type: DataTypes.STRING(150), defaultValue: '' },
    kelas:         { type: DataTypes.STRING(100), defaultValue: '' },
    deskripsi:     { type: DataTypes.TEXT,        defaultValue: '' },
    guru:          { type: DataTypes.STRING(100), defaultValue: '' },
    nodes:         { type: DataTypes.JSON,        defaultValue: {} },
    warna:         { type: DataTypes.STRING(20),  defaultValue: '#3b82f6' },
  },
  {
    sequelize,
    modelName:  'MindMap',
    tableName:  'mindmaps',
    timestamps: true,
    indexes: [
      { fields: ['guruId'] },
      { fields: ['guruId','kelas'] },
    ],
  }
);

module.exports = MindMap;
