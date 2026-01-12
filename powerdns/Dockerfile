FROM powerdns/pdns-auth-49:latest

USER root

# Install netcat for healthcheck and db wait
RUN apt-get update && apt-get install -y netcat-openbsd curl && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script with execute permissions
COPY --chmod=755 entrypoint.sh /entrypoint.sh

# Expose DNS and API ports
EXPOSE 53/udp 53/tcp 8081

ENTRYPOINT ["/entrypoint.sh"]
