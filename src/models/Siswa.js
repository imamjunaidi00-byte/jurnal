'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Siswa extends Model {
  // Virtual: hitung umur dari tanggalLahir
  get umur() {
    if (!this.tanggalLahir) return null;
    const today     = new Date();
    const birthDate = new Date(this.tanggalLahir);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }
}

Siswa.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    guruId: {
      type:         DataTypes.INTEGER.UNSIGNED,
      allowNull:    true,
      defaultValue: null,
    },
    kelasId: {
      type:         DataTypes.INTEGER.UNSIGNED,
      allowNull:    true,
      defaultValue: null,
    },
    nama: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 100] },
      set(val) { this.setDataValue('nama', val?.trim()); },
    },
    nisn: {
      type:      DataTypes.STRING(20),
      allowNull: false,
      unique:    true,
      set(val) { this.setDataValue('nisn', val?.trim()); },
    },
    nis: {
      type:         DataTypes.STRING(20),
      allowNull:    true,
      unique:       true,   // NULL-safe: MariaDB boleh banyak NULL di UNIQUE
      defaultValue: null,
      set(val) { this.setDataValue('nis', val?.trim() || null); },
    },
    kelas: {
      type:         DataTypes.STRING(100),
      allowNull:    true,
      defaultValue: null,
      comment:      'Denormalized dari kelasId.nama',
    },
    jenisKelamin: {
      type:      DataTypes.ENUM('L', 'P'),
      allowNull: false,
    },
    tempatLahir: {
      type:         DataTypes.STRING(100),
      allowNull:    true,
      defaultValue: null,
    },
    tanggalLahir: {
      type:         DataTypes.DATEONLY,
      allowNull:    true,
      defaultValue: null,
    },
    agama: {
      type:         DataTypes.ENUM('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya'),
      allowNull:    true,
      defaultValue: null,
    },
    alamat: {
      type:         DataTypes.TEXT,
      allowNull:    true,
      defaultValue: null,
    },
    namaAyah: {
      type:         DataTypes.STRING(100),
      allowNull:    true,
      defaultValue: null,
    },
    namaIbu: {
      type:         DataTypes.STRING(100),
      allowNull:    true,
      defaultValue: null,
    },
    telpOrtu: {
      type:         DataTypes.STRING(20),
      allowNull:    true,
      defaultValue: null,
    },
    noHp: {
      type:         DataTypes.STRING(20),
      allowNull:    true,
      defaultValue: null,
    },
    tahunMasuk: {
      type:         DataTypes.SMALLINT.UNSIGNED,
      allowNull:    true,
      defaultValue: null,
    },
    penerimaBantuan: {
      type:         DataTypes.ENUM('Tidak','PIP','KIP','BSM','PKH','Lainnya'),
      defaultValue: 'Tidak',
    },
    status: {
      type:         DataTypes.ENUM('Aktif','Nonaktif','Lulus','Keluar'),
      defaultValue: 'Aktif',
    },
    foto: {
      type:         DataTypes.TEXT,
      allowNull:    true,
      defaultValue: null,
      comment:      'Base64 atau path file foto',
    },
  },
  {
    sequelize,
    modelName:  'Siswa',
    tableName:  'siswas',
    timestamps: true,
    indexes: [
      { fields: ['kelasId', 'status'] },
      { fields: ['kelas', 'status'] },
      { fields: ['guruId'] },
    ],
  }
);

module.exports = Siswa;
