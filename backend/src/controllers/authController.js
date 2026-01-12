const jwt = require('jsonwebtoken');
const { User } = require('../models/associations');
const logger = require('../config/logger');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const authController = {
  // Register new user
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const user = await User.create({
        username,
        email,
        password,
      });

      const token = generateToken(user.id);

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      const isValidPassword = await user.validatePassword(password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      const token = generateToken(user.id);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user
  async me(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;

      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use',
          });
        }
      }

      await req.user.update({
        ...(username && { username }),
        ...(email && { email }),
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const isValid = await req.user.validatePassword(currentPassword);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      await req.user.update({ password: newPassword });

      logger.info(`Password changed for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
