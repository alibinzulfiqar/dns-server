FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check - increased start-period to allow for DB sync and seeding
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "src/app.js"]
