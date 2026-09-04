'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Config extends Model {}

Config.init(
  {
    id:      { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    key:     { type: DataTypes.STRING(80),        allowNull: false },
    value:   { type: DataTypes.JSON,              allowNull: false },
  },
  {
    sequelize,
    modelName:  'Config',
    tableName:  'configs',
    timestamps: true,
    updatedAt:  'updatedAt',
    createdAt:  false,
    indexes: [
      { unique: true, fields: ['guruId','key'], name: 'uq_config' },
    ],
  }
);

module.exports = Config;
