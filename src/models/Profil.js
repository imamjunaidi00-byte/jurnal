'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Profil extends Model {}

Profil.init(
  {
    id:      { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    // Profil guru
    namaGuru:  { type: DataTypes.STRING(100), defaultValue: '' },
    mapelGuru: { type: DataTypes.JSON, defaultValue: [] },  // array string
    fotoGuru:  { type: DataTypes.TEXT, defaultValue: '' },
    // Kelas yang diajar
    kelasList:        { type: DataTypes.JSON, defaultValue: [] },
    kelasMapelMapping:{ type: DataTypes.JSON, defaultValue: {} },
    // Semester & tahun ajaran aktif
    semester:    { type: DataTypes.ENUM('Ganjil','Genap'), defaultValue: 'Ganjil' },
    tahunAjaran: { type: DataTypes.STRING(20), defaultValue: '' },
    // Bobot penilaian
    bobotPengetahuan:  { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 60 },
    bobotKeterampilan: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 40 },
    bobotKehadiran:    { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0  },
    // Data app tambahan (JSON fleksibel)
    appData: { type: DataTypes.JSON, defaultValue: {} },
  },
  {
    sequelize,
    modelName:  'Profil',
    tableName:  'profils',
    timestamps: true,
    indexes: [{ fields: ['guruId'] }],
  }
);

module.exports = Profil;
