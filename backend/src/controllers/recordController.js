const { DnsRecord, Domain } = require('../models/associations');
const powerDNS = require('../services/powerdns');
const logger = require('../config/logger');

const recordController = {
  // Get all records for a domain
  async getAll(req, res, next) {
    try {
      const { domainId } = req.params;
      const { type, search } = req.query;

      // Verify domain ownership
      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const whereClause = { domainId };

      if (type) {
        whereClause.type = type;
      }

      if (search) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const records = await DnsRecord.findAll({
        where: whereClause,
        order: [
          ['type', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      res.json({
        success: true,
        data: {
          records,
          domain: {
            id: domain.id,
            name: domain.name,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single record
  async getOne(req, res, next) {
    try {
      const { domainId, id } = req.params;

      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const record = await DnsRecord.findOne({
        where: {
          id,
          domainId,
        },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      }

      res.json({
        success: true,
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  },

  // Create record
  async create(req, res, next) {
    try {
      const { domainId } = req.params;
      const { name, type, content, ttl, priority, disabled } = req.body;

      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      // Build full record name
      const fullName = name === '@' || name === '' 
        ? domain.name 
        : `${name}.${domain.name}`;

      const record = await DnsRecord.create({
        domainId,
        name: fullName,
        type,
        content,
        ttl: ttl || domain.defaultTtl,
        priority: ['MX', 'SRV'].includes(type) ? priority || 10 : null,
        disabled: disabled || false,
      });

      // Sync to PowerDNS
      try {
        await powerDNS.addRecord(domain.name, record);
      } catch (pdnsError) {
        logger.warn('PowerDNS record sync failed:', pdnsError.message);
      }

      // Update domain record count
      const recordCount = await DnsRecord.count({ where: { domainId } });
      await domain.update({ 
        recordCount,
        soaSerial: Math.floor(Date.now() / 1000),
      });

      logger.info(`Record created: ${type} ${fullName} -> ${content}`);

      res.status(201).json({
        success: true,
        message: 'Record created successfully',
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  },

  // Update record
  async update(req, res, next) {
    try {
      const { domainId, id } = req.params;
      const { name, type, content, ttl, priority, disabled } = req.body;

      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const record = await DnsRecord.findOne({
        where: {
          id,
          domainId,
        },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      }

      // Delete old record from PowerDNS
      try {
        await powerDNS.deleteRecord(domain.name, record);
      } catch (pdnsError) {
        logger.warn('PowerDNS record delete failed:', pdnsError.message);
      }

      const fullName = name === '@' || name === '' 
        ? domain.name 
        : name.endsWith(domain.name) 
          ? name 
          : `${name}.${domain.name}`;

      await record.update({
        ...(name && { name: fullName }),
        ...(type && { type }),
        ...(content && { content }),
        ...(ttl && { ttl }),
        ...(priority !== undefined && { priority }),
        ...(typeof disabled === 'boolean' && { disabled }),
      });

      // Add updated record to PowerDNS
      try {
        await powerDNS.addRecord(domain.name, record);
      } catch (pdnsError) {
        logger.warn('PowerDNS record sync failed:', pdnsError.message);
      }

      // Update SOA serial
      await domain.update({ soaSerial: Math.floor(Date.now() / 1000) });

      logger.info(`Record updated: ${record.type} ${record.name}`);

      res.json({
        success: true,
        message: 'Record updated successfully',
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete record
  async delete(req, res, next) {
    try {
      const { domainId, id } = req.params;

      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const record = await DnsRecord.findOne({
        where: {
          id,
          domainId,
        },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      }

      // Delete from PowerDNS
      try {
        await powerDNS.deleteRecord(domain.name, record);
      } catch (pdnsError) {
        logger.warn('PowerDNS record delete failed:', pdnsError.message);
      }

      await record.destroy();

      // Update domain record count
      const recordCount = await DnsRecord.count({ where: { domainId } });
      await domain.update({ 
        recordCount,
        soaSerial: Math.floor(Date.now() / 1000),
      });

      logger.info(`Record deleted: ${record.type} ${record.name}`);

      res.json({
        success: true,
        message: 'Record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk create records
  async bulkCreate(req, res, next) {
    try {
      const { domainId } = req.params;
      const { records } = req.body;

      const domain = await Domain.findOne({
        where: {
          id: domainId,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const createdRecords = [];
      
      for (const rec of records) {
        const fullName = rec.name === '@' || rec.name === '' 
          ? domain.name 
          : `${rec.name}.${domain.name}`;

        const record = await DnsRecord.create({
          domainId,
          name: fullName,
          type: rec.type,
          content: rec.content,
          ttl: rec.ttl || domain.defaultTtl,
          priority: ['MX', 'SRV'].includes(rec.type) ? rec.priority || 10 : null,
          disabled: rec.disabled || false,
        });

        createdRecords.push(record);

        try {
          await powerDNS.addRecord(domain.name, record);
        } catch (pdnsError) {
          logger.warn('PowerDNS record sync failed:', pdnsError.message);
        }
      }

      // Update domain record count
      const recordCount = await DnsRecord.count({ where: { domainId } });
      await domain.update({ 
        recordCount,
        soaSerial: Math.floor(Date.now() / 1000),
      });

      res.status(201).json({
        success: true,
        message: `${createdRecords.length} records created successfully`,
        data: { records: createdRecords },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = recordController;
