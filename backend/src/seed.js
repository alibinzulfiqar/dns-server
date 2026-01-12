const bcrypt = require('bcryptjs');
const logger = require('./config/logger');

const seedDatabase = async (sequelize) => {
  try {
    const User = sequelize.models.User;
    
    // Check if admin user exists
    const adminExists = await User.findOne({ where: { email: 'admin@hopevalley.cloud' } });
    
    if (!adminExists) {
      // Create default admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@2026!', salt);
      
      await User.create({
        username: 'admin',
        email: 'admin@hopevalley.cloud',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      }, {
        hooks: false // Skip the beforeCreate hook since we're pre-hashing
      });
      
      logger.info('Default admin user created:');
      logger.info('  Email: admin@hopevalley.cloud');
      logger.info('  Password: Admin@2026!');
      logger.info('  ⚠️  Please change this password after first login!');
    } else {
      logger.info('Admin user already exists, skipping seed');
    }
  } catch (error) {
    logger.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
