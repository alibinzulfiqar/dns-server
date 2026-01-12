const User = require('./User');
const Domain = require('./Domain');
const DnsRecord = require('./DnsRecord');

// Define associations
User.hasMany(Domain, { foreignKey: 'userId', as: 'domains' });
Domain.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Domain.hasMany(DnsRecord, { foreignKey: 'domainId', as: 'records', onDelete: 'CASCADE' });
DnsRecord.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

module.exports = {
  User,
  Domain,
  DnsRecord,
};
