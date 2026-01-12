const { Domain, DnsRecord } = require('../models/associations');
const powerDNS = require('../services/powerdns');
const logger = require('../config/logger');

const domainController = {
  // Get all domains for user
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        userId: req.user.id,
      };

      if (search) {
        const { Op } = require('sequelize');
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      const { count, rows: domains } = await Domain.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: DnsRecord,
            as: 'records',
            attributes: ['id'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Add record count to each domain
      const domainsWithStats = domains.map((domain) => ({
        ...domain.toJSON(),
        recordCount: domain.records.length,
      }));

      res.json({
        success: true,
        data: {
          domains: domainsWithStats,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single domain
  async getOne(req, res, next) {
    try {
      const domain = await Domain.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
        include: [
          {
            model: DnsRecord,
            as: 'records',
            order: [['type', 'ASC'], ['name', 'ASC']],
          },
        ],
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      res.json({
        success: true,
        data: { domain },
      });
    } catch (error) {
      next(error);
    }
  },

  // Create domain
  async create(req, res, next) {
    try {
      const { name, type, soaPrimary, soaEmail, defaultTtl } = req.body;

      // Check if domain already exists
      const existingDomain = await Domain.findOne({ where: { name } });
      if (existingDomain) {
        return res.status(409).json({
          success: false,
          message: 'Domain already exists',
        });
      }

      const domain = await Domain.create({
        name,
        type: type || 'NATIVE',
        userId: req.user.id,
        soaPrimary: soaPrimary || `ns1.${name}`,
        soaEmail: soaEmail || `hostmaster.${name}`,
        soaSerial: Math.floor(Date.now() / 1000),
        defaultTtl: defaultTtl || 3600,
      });

      // Create zone in PowerDNS
      try {
        await powerDNS.createZone(domain);
      } catch (pdnsError) {
        logger.warn('PowerDNS zone creation failed:', pdnsError.message);
        // Continue even if PowerDNS fails (for mock mode or testing)
      }

      logger.info(`Domain created: ${name} by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Domain created successfully',
        data: { domain },
      });
    } catch (error) {
      next(error);
    }
  },

  // Update domain
  async update(req, res, next) {
    try {
      const domain = await Domain.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      const {
        soaPrimary,
        soaEmail,
        soaRefresh,
        soaRetry,
        soaExpire,
        soaTtl,
        defaultTtl,
        isActive,
      } = req.body;

      // Increment SOA serial on update
      const newSerial = Math.floor(Date.now() / 1000);

      await domain.update({
        ...(soaPrimary && { soaPrimary }),
        ...(soaEmail && { soaEmail }),
        ...(soaRefresh && { soaRefresh }),
        ...(soaRetry && { soaRetry }),
        ...(soaExpire && { soaExpire }),
        ...(soaTtl && { soaTtl }),
        ...(defaultTtl && { defaultTtl }),
        ...(typeof isActive === 'boolean' && { isActive }),
        soaSerial: newSerial,
      });

      logger.info(`Domain updated: ${domain.name}`);

      res.json({
        success: true,
        message: 'Domain updated successfully',
        data: { domain },
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete domain
  async delete(req, res, next) {
    try {
      const domain = await Domain.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found',
        });
      }

      // Delete zone from PowerDNS
      try {
        await powerDNS.deleteZone(domain.name);
      } catch (pdnsError) {
        logger.warn('PowerDNS zone deletion failed:', pdnsError.message);
      }

      // Delete all records first (cascade should handle this, but being explicit)
      await DnsRecord.destroy({ where: { domainId: domain.id } });
      
      await domain.destroy();

      logger.info(`Domain deleted: ${domain.name} by user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Domain deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get domain statistics
  async getStats(req, res, next) {
    try {
      const domains = await Domain.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: DnsRecord,
            as: 'records',
            attributes: ['type'],
          },
        ],
      });

      const stats = {
        totalDomains: domains.length,
        totalRecords: 0,
        recordsByType: {},
        recentDomains: [],
      };

      domains.forEach((domain) => {
        stats.totalRecords += domain.records.length;
        domain.records.forEach((record) => {
          stats.recordsByType[record.type] = (stats.recordsByType[record.type] || 0) + 1;
        });
      });

      // Get 5 most recent domains
      stats.recentDomains = domains
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          name: d.name,
          recordCount: d.records.length,
          updatedAt: d.updatedAt,
        }));

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = domainController;
