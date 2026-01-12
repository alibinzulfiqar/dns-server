const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createDomainValidation = [
  body('name')
    .trim()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/)
    .withMessage('Invalid domain name format'),
  body('type')
    .optional()
    .isIn(['NATIVE', 'MASTER', 'SLAVE'])
    .withMessage('Type must be NATIVE, MASTER, or SLAVE'),
  body('defaultTtl')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('TTL must be between 60 and 86400 seconds'),
];

const updateDomainValidation = [
  body('soaPrimary')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SOA Primary NS cannot be empty'),
  body('soaEmail')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SOA Email cannot be empty'),
  body('soaRefresh')
    .optional()
    .isInt({ min: 60 })
    .withMessage('SOA Refresh must be at least 60'),
  body('soaRetry')
    .optional()
    .isInt({ min: 60 })
    .withMessage('SOA Retry must be at least 60'),
  body('soaExpire')
    .optional()
    .isInt({ min: 3600 })
    .withMessage('SOA Expire must be at least 3600'),
  body('defaultTtl')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('TTL must be between 60 and 86400 seconds'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get('/', domainController.getAll);
router.get('/stats', domainController.getStats);
router.get('/:id', domainController.getOne);
router.post('/', validate(createDomainValidation), domainController.create);
router.put('/:id', validate(updateDomainValidation), domainController.update);
router.delete('/:id', domainController.delete);

module.exports = router;
