# Vanguard Anti-Counterfeiting System - Production Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    postgresql-client \
    redis \
    bash \
    curl \
    git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --only=production

# Install client dependencies and build
WORKDIR /app/client
RUN npm ci
COPY client/ ./
RUN npm run build

# Copy server code
WORKDIR /app
COPY server/ ./server/

# Create necessary directories
RUN mkdir -p /app/server/data/models \
    && mkdir -p /app/server/data/ml \
    && mkdir -p /app/server/uploads \
    && mkdir -p /app/logs

# Set permissions
RUN chmod -R 755 /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server/index.js"]