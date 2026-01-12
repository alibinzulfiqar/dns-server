const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Domain = sequelize.define(
  'Domain',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/,
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('NATIVE', 'MASTER', 'SLAVE'),
      defaultValue: 'NATIVE',
    },
    soaPrimary: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'ns1.example.com',
    },
    soaEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'hostmaster.example.com',
    },
    soaSerial: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
    soaRefresh: {
      type: DataTypes.INTEGER,
      defaultValue: 10800,
    },
    soaRetry: {
      type: DataTypes.INTEGER,
      defaultValue: 3600,
    },
    soaExpire: {
      type: DataTypes.INTEGER,
      defaultValue: 604800,
    },
    soaTtl: {
      type: DataTypes.INTEGER,
      defaultValue: 3600,
    },
    defaultTtl: {
      type: DataTypes.INTEGER,
      defaultValue: 3600,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    recordCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'domains',
    timestamps: true,
  }
);

module.exports = Domain;
