'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class PengabsenKelas extends Model {
  async matchPassword(entered) {
    return bcrypt.compare(entered, this.password);
  }
  toJSON() {
    const v = { ...this.get() };
    delete v.password;
    return v;
  }
}

PengabsenKelas.init(
  {
    id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    username: {
      type: DataTypes.STRING(80), allowNull: false, unique: true,
      set(val) { this.setDataValue('username', val?.toLowerCase().trim()); },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    nama:     { type: DataTypes.STRING(100), allowNull: false },
    kelas:    { type: DataTypes.STRING(100), allowNull: false },
    aktif:    { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName:  'PengabsenKelas',
    tableName:  'pengabsen_kelas',
    timestamps: true,
    indexes: [{ fields: ['guruId'] }],
    hooks: {
      beforeCreate: async (p) => { if (p.password) p.password = await bcrypt.hash(p.password, 10); },
      beforeUpdate: async (p) => { if (p.changed('password')) p.password = await bcrypt.hash(p.password, 10); },
    },
  }
);

module.exports = PengabsenKelas;
