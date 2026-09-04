'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class LoginLog extends Model {}

LoginLog.init(
  {
    id:        { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    guruId:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    username:  { type: DataTypes.STRING(80),       allowNull: false },
    nama:      { type: DataTypes.STRING(100),      defaultValue: '' },
    ip:        { type: DataTypes.STRING(50),       defaultValue: '' },
    userAgent: { type: DataTypes.TEXT,             defaultValue: '' },
    loginAt:   { type: DataTypes.DATE,             defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName:  'LoginLog',
    tableName:  'login_logs',
    timestamps: false,
    indexes: [
      { fields: ['guruId','loginAt'] },
      { fields: ['loginAt'] },
    ],
  }
);

module.exports = LoginLog;
