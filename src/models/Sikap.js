'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

const MAP_NILAI   = { SB: 4, B: 3, C: 2, K: 1 };
const MAP_PREDIKAT= { 4: 'SB', 3: 'B', 2: 'C', 1: 'K' };
const LABEL       = { SB: 'Sangat Baik', B: 'Baik', C: 'Cukup', K: 'Kurang' };

function hitungSikap(instance) {
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + (MAP_NILAI[b] || 3), 0) / arr.length);

  const nilaiSpiritual = MAP_PREDIKAT[avg([instance.berdoa, instance.toleransi, instance.bersyukur])];
  const nilaiSosial    = MAP_PREDIKAT[avg([instance.jujur, instance.disiplin, instance.tanggungJawab, instance.santun, instance.peduli, instance.percayaDiri])];

  instance.nilaiSpiritual    = nilaiSpiritual;
  instance.nilaiSosial       = nilaiSosial;
  instance.deskripsiSpiritual= `Anak ${LABEL[nilaiSpiritual]?.toLowerCase()} dalam sikap spiritual`;
  instance.deskripsiSosial   = `Anak ${LABEL[nilaiSosial]?.toLowerCase()} dalam sikap sosial`;
}

const ENUM_SIKAP = ['SB', 'B', 'C', 'K'];

class Sikap extends Model {}

Sikap.init(
  {
    id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    siswaId:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    kelas:        { type: DataTypes.STRING(100),       allowNull: false },
    semester:     { type: DataTypes.ENUM('Ganjil','Genap'), allowNull: false },
    tahunAjaran:  { type: DataTypes.STRING(20),        allowNull: false },
    // Aspek Spiritual
    berdoa:    { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    toleransi: { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    bersyukur: { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    // Aspek Sosial
    jujur:         { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    disiplin:      { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    tanggungJawab: { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    santun:        { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    peduli:        { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    percayaDiri:   { type: DataTypes.ENUM(...ENUM_SIKAP), defaultValue: 'B' },
    // Auto-computed
    nilaiSpiritual:     { type: DataTypes.ENUM(...ENUM_SIKAP), allowNull: true },
    nilaiSosial:        { type: DataTypes.ENUM(...ENUM_SIKAP), allowNull: true },
    deskripsiSpiritual: { type: DataTypes.TEXT, defaultValue: '' },
    deskripsiSosial:    { type: DataTypes.TEXT, defaultValue: '' },
  },
  {
    sequelize,
    modelName:  'Sikap',
    tableName:  'sikaps',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['guruId','siswaId','semester','tahunAjaran'], name: 'uq_sikap' },
      { fields: ['guruId','kelas','semester','tahunAjaran'] },
    ],
    hooks: {
      beforeCreate: hitungSikap,
      beforeUpdate: hitungSikap,
    },
  }
);

module.exports = Sikap;
