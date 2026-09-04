'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class Guru extends Model {
  // Verifikasi password
  async matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  // Hapus password dari output JSON
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

Guru.init(
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    username: {
      type:      DataTypes.STRING(80),
      allowNull: false,
      unique:    true,
      set(val) { this.setDataValue('username', val?.toLowerCase().trim()); },
    },
    password: {
      type:      DataTypes.STRING(255),
      allowNull: false,
    },
    nama: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type:         DataTypes.ENUM('guru', 'admin'),
      defaultValue: 'guru',
      allowNull:    false,
    },
    isWaliKelas: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
    },
    kelasWali: {
      type:         DataTypes.STRING(100),
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName:  'Guru',
    tableName:  'gurus',
    timestamps: true,
    hooks: {
      beforeCreate: async (guru) => {
        if (guru.password) {
          guru.password = await bcrypt.hash(guru.password, 10);
        }
      },
      beforeUpdate: async (guru) => {
        if (guru.changed('password')) {
          guru.password = await bcrypt.hash(guru.password, 10);
        }
      },
    },
  }
);

module.exports = Guru;
