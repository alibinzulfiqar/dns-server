#!/bin/sh
set -e

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
gpgsql-dnssec=yes

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
loglevel=4

# SOA defaults
default-soa-content=ns1.@ hostmaster.@ 0 10800 3600 604800 3600

# Allow zone transfers
allow-axfr-ips=127.0.0.0/8,::1
EOF

echo "PowerDNS configuration generated"

# Start PowerDNS (runs as pdns user internally)
exec /usr/sbin/pdns_server --config-dir=/etc/powerdns --setuid=pdns --setgid=pdns
