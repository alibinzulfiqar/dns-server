const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createRecordValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Record name is required'),
  body('type')
    .isIn(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'PTR', 'CAA'])
    .withMessage('Invalid record type'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Record content is required'),
  body('ttl')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('TTL must be between 60 and 86400 seconds'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 65535 })
    .withMessage('Priority must be between 0 and 65535'),
];

const updateRecordValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Record name cannot be empty'),
  body('type')
    .optional()
    .isIn(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'PTR', 'CAA'])
    .withMessage('Invalid record type'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Record content cannot be empty'),
  body('ttl')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('TTL must be between 60 and 86400 seconds'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 65535 })
    .withMessage('Priority must be between 0 and 65535'),
];

const bulkCreateValidation = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be a non-empty array'),
  body('records.*.name')
    .trim()
    .notEmpty()
    .withMessage('Record name is required'),
  body('records.*.type')
    .isIn(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'PTR', 'CAA'])
    .withMessage('Invalid record type'),
  body('records.*.content')
    .trim()
    .notEmpty()
    .withMessage('Record content is required'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get('/:domainId/records', recordController.getAll);
router.get('/:domainId/records/:id', recordController.getOne);
router.post('/:domainId/records', validate(createRecordValidation), recordController.create);
router.post('/:domainId/records/bulk', validate(bulkCreateValidation), recordController.bulkCreate);
router.put('/:domainId/records/:id', validate(updateRecordValidation), recordController.update);
router.delete('/:domainId/records/:id', recordController.delete);

module.exports = router;
