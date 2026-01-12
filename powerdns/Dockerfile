FROM powerdns/pdns-auth-49:latest

USER root

# Copy entrypoint script with execute permissions
COPY --chmod=755 entrypoint.sh /entrypoint.sh

# Expose DNS and API ports
EXPOSE 53/udp 53/tcp 8081

ENTRYPOINT ["/entrypoint.sh"]
