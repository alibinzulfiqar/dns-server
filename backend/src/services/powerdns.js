const axios = require('axios');
const logger = require('../config/logger');

class PowerDNSService {
  constructor() {
    this.apiUrl = process.env.PDNS_API_URL || 'http://localhost:8081';
    this.apiKey = process.env.PDNS_API_KEY || '';
    this.useMock = process.env.USE_MOCK_DNS === 'true';
    
    if (!this.useMock) {
      this.client = axios.create({
        baseURL: `${this.apiUrl}/api/v1`,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  async createZone(domain) {
    if (this.useMock) {
      logger.info(`[Mock DNS] Creating zone: ${domain.name}`);
      return { success: true, data: { id: domain.name, name: domain.name } };
    }

    try {
      const soaRecord = `${domain.soaPrimary} ${domain.soaEmail.replace('@', '.')} ${domain.soaSerial} ${domain.soaRefresh} ${domain.soaRetry} ${domain.soaExpire} ${domain.soaTtl}`;
      
      const response = await this.client.post('/servers/localhost/zones', {
        name: `${domain.name}.`,
        kind: domain.type,
        nameservers: [],
        rrsets: [
          {
            name: `${domain.name}.`,
            type: 'SOA',
            ttl: domain.defaultTtl,
            records: [{ content: soaRecord, disabled: false }],
          },
        ],
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('PowerDNS createZone error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create zone in PowerDNS');
    }
  }

  async deleteZone(zoneName) {
    if (this.useMock) {
      logger.info(`[Mock DNS] Deleting zone: ${zoneName}`);
      return { success: true };
    }

    try {
      await this.client.delete(`/servers/localhost/zones/${zoneName}.`);
      return { success: true };
    } catch (error) {
      logger.error('PowerDNS deleteZone error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to delete zone in PowerDNS');
    }
  }

  async getZone(zoneName) {
    if (this.useMock) {
      logger.info(`[Mock DNS] Getting zone: ${zoneName}`);
      return { success: true, data: { name: zoneName, rrsets: [] } };
    }

    try {
      const response = await this.client.get(`/servers/localhost/zones/${zoneName}.`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('PowerDNS getZone error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to get zone from PowerDNS');
    }
  }

  async updateRecords(zoneName, rrsets) {
    if (this.useMock) {
      logger.info(`[Mock DNS] Updating records for zone: ${zoneName}`, rrsets);
      return { success: true };
    }

    try {
      await this.client.patch(`/servers/localhost/zones/${zoneName}.`, { rrsets });
      return { success: true };
    } catch (error) {
      logger.error('PowerDNS updateRecords error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update records in PowerDNS');
    }
  }

  async addRecord(zoneName, record) {
    const rrset = {
      name: record.name.endsWith('.') ? record.name : `${record.name}.`,
      type: record.type,
      ttl: record.ttl,
      changetype: 'REPLACE',
      records: [
        {
          content: record.content,
          disabled: record.disabled || false,
        },
      ],
    };

    if (record.priority !== null && record.priority !== undefined) {
      rrset.records[0].content = `${record.priority} ${record.content}`;
    }

    return this.updateRecords(zoneName, [rrset]);
  }

  async deleteRecord(zoneName, record) {
    const rrset = {
      name: record.name.endsWith('.') ? record.name : `${record.name}.`,
      type: record.type,
      changetype: 'DELETE',
    };

    return this.updateRecords(zoneName, [rrset]);
  }

  async getServerInfo() {
    if (this.useMock) {
      return {
        success: true,
        data: {
          type: 'mock',
          version: '1.0.0',
          daemon_type: 'mock',
        },
      };
    }

    try {
      const response = await this.client.get('/servers/localhost');
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('PowerDNS getServerInfo error:', error.response?.data || error.message);
      throw new Error('Failed to connect to PowerDNS');
    }
  }
}

module.exports = new PowerDNSService();
