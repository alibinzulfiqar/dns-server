const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const DnsRecord = sequelize.define(
  'DnsRecord',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    domainId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'domains',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'SOA', 'PTR', 'CAA'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ttl: {
      type: DataTypes.INTEGER,
      defaultValue: 3600,
      validate: {
        min: 60,
        max: 86400,
      },
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'dns_records',
    timestamps: true,
    indexes: [
      {
        fields: ['domainId'],
      },
      {
        fields: ['name', 'type'],
      },
    ],
  }
);

module.exports = DnsRecord;
