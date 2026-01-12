#!/bin/sh
set -e

echo "Starting PowerDNS setup..."

# Wait for database to be ready
echo "Waiting for database connection..."
until nc -z ${PDNS_DB_HOST:-dns-postgres} ${PDNS_DB_PORT:-5432}; do
  echo "Database not ready, waiting..."
  sleep 2
done
echo "Database is ready!"

# Create PowerDNS schema if not exists
echo "Ensuring PowerDNS schema exists..."
PGPASSWORD=${PDNS_DB_PASSWORD} psql -h ${PDNS_DB_HOST:-dns-postgres} -U ${PDNS_DB_USER:-postgres} -d ${PDNS_DB_NAME:-dns_manager} << 'EOSQL'
CREATE TABLE IF NOT EXISTS domains (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  master                VARCHAR(128) DEFAULT NULL,
  last_check            INT DEFAULT NULL,
  type                  VARCHAR(8) NOT NULL DEFAULT 'NATIVE',
  notified_serial       BIGINT DEFAULT NULL,
  account               VARCHAR(40) DEFAULT NULL,
  options               TEXT DEFAULT NULL,
  catalog               TEXT DEFAULT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS name_index ON domains(name);

CREATE TABLE IF NOT EXISTS records (
  id                    BIGSERIAL PRIMARY KEY,
  domain_id             INT DEFAULT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name                  VARCHAR(255) DEFAULT NULL,
  type                  VARCHAR(10) DEFAULT NULL,
  content               VARCHAR(65535) DEFAULT NULL,
  ttl                   INT DEFAULT NULL,
  prio                  INT DEFAULT NULL,
  disabled              BOOL DEFAULT 'f',
  ordername             VARCHAR(255),
  auth                  BOOL DEFAULT 't'
);
CREATE INDEX IF NOT EXISTS rec_name_index ON records(name);
CREATE INDEX IF NOT EXISTS nametype_index ON records(name,type);
CREATE INDEX IF NOT EXISTS domain_id ON records(domain_id);
CREATE INDEX IF NOT EXISTS recordorder ON records (domain_id, ordername text_pattern_ops);

CREATE TABLE IF NOT EXISTS supermasters (
  ip                    INET NOT NULL,
  nameserver            VARCHAR(255) NOT NULL,
  account               VARCHAR(40) NOT NULL,
  PRIMARY KEY (ip, nameserver)
);

CREATE TABLE IF NOT EXISTS comments (
  id                    SERIAL PRIMARY KEY,
  domain_id             INT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name                  VARCHAR(255) NOT NULL,
  type                  VARCHAR(10) NOT NULL,
  modified_at           INT NOT NULL,
  account               VARCHAR(40) DEFAULT NULL,
  comment               VARCHAR(65535) NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_domain_id_idx ON comments (domain_id);
CREATE INDEX IF NOT EXISTS comments_name_type_idx ON comments (name, type);
CREATE INDEX IF NOT EXISTS comments_order_idx ON comments (domain_id, modified_at);

CREATE TABLE IF NOT EXISTS domainmetadata (
  id                    SERIAL PRIMARY KEY,
  domain_id             INT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  kind                  VARCHAR(32),
  content               TEXT
);
CREATE INDEX IF NOT EXISTS domainidmetaindex ON domainmetadata(domain_id);

CREATE TABLE IF NOT EXISTS cryptokeys (
  id                    SERIAL PRIMARY KEY,
  domain_id             INT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  flags                 INT NOT NULL,
  active                BOOL,
  published             BOOL DEFAULT TRUE,
  content               TEXT
);
CREATE INDEX IF NOT EXISTS domainidindex ON cryptokeys(domain_id);

CREATE TABLE IF NOT EXISTS tsigkeys (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255),
  algorithm             VARCHAR(50),
  secret                VARCHAR(255)
);
CREATE UNIQUE INDEX IF NOT EXISTS namealgoindex ON tsigkeys(name, algorithm);
EOSQL
echo "Schema ready!"

# Generate pdns.conf from template with environment variables
cat > /etc/powerdns/pdns.conf << EOF
# PowerDNS Authoritative Server Configuration

# Backend - PostgreSQL
launch=gpgsql
gpgsql-host=${PDNS_DB_HOST:-dns-postgres}
gpgsql-port=${PDNS_DB_PORT:-5432}
gpgsql-dbname=${PDNS_DB_NAME:-dns_manager}
gpgsql-user=${PDNS_DB_USER:-postgres}
gpgsql-password=${PDNS_DB_PASSWORD}
gpgsql-dnssec=no

# API Configuration
api=yes
api-key=${PDNS_AUTH_API_KEY:-pdns-secret-api-key}
webserver=yes
webserver-address=0.0.0.0
webserver-port=8081
webserver-allow-from=0.0.0.0/0

# Server Settings
local-address=0.0.0.0
local-port=53
daemon=no
guardian=no
disable-syslog=yes
log-dns-queries=yes
loglevel=6

# SOA defaults
default-soa-content=ns1.@ hostmaster.@ 0 10800 3600 604800 3600

# Allow zone transfers
allow-axfr-ips=127.0.0.0/8,::1
EOF

echo "PowerDNS configuration generated:"
cat /etc/powerdns/pdns.conf | grep -v password

echo "Starting PowerDNS server..."

# Find pdns_server binary
PDNS_BIN=$(which pdns_server || find /usr -name "pdns_server" 2>/dev/null | head -1)

if [ -z "$PDNS_BIN" ]; then
  echo "ERROR: pdns_server binary not found!"
  echo "Searching for pdns binaries..."
  find /usr -name "pdns*" 2>/dev/null
  exit 1
fi

echo "Found PowerDNS at: $PDNS_BIN"

# Start PowerDNS
exec $PDNS_BIN --config-dir=/etc/powerdns
