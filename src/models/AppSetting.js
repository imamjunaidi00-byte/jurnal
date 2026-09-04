'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AppSetting extends Model {}

AppSetting.init(
  {
    id:    { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    key:   { type: DataTypes.STRING(80), allowNull: false, unique: true },
    value: { type: DataTypes.JSON,       allowNull: false },
  },
  {
    sequelize,
    modelName: 'AppSetting',
    tableName: 'app_settings',
    timestamps: true,
  }
);

module.exports = AppSetting;
