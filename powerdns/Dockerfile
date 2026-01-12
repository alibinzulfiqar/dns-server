FROM powerdns/pdns-auth-49:latest

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose DNS and API ports
EXPOSE 53/udp 53/tcp 8081

ENTRYPOINT ["/entrypoint.sh"]
