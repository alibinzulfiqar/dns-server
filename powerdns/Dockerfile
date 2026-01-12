FROM powerdns/pdns-auth-49:latest

USER root

# Install netcat for healthcheck and db wait, psql for schema creation
RUN apt-get update && apt-get install -y netcat-openbsd curl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script with execute permissions
COPY --chmod=755 entrypoint.sh /entrypoint.sh

# Expose DNS and API ports
EXPOSE 53/udp 53/tcp 8081

# Healthcheck - check if DNS port 53 is listening
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=10 \
  CMD nc -z localhost 53 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
