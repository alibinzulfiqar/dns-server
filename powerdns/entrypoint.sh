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

# Start PowerDNS
exec /usr/sbin/pdns_server --config-dir=/etc/powerdns
