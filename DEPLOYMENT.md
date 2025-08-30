# Vanguard System Deployment Guide

## Overview

This guide covers deploying the Vanguard Anti-Counterfeiting System to production environments. The system consists of a Node.js backend API and a React frontend Progressive Web App (PWA).

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Database      │
│   (Nginx/ALB)   │────│   (Node.js)     │────│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Ethereum)    │
                       └─────────────────┘
```

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (for session storage)
- SSL Certificate
- Domain name
- Blockchain node access (Infura/Alchemy)

## Environment Setup

### Production Environment Variables

#### Server (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=vanguard_prod
DB_USER=vanguard_prod_user
DB_PASSWORD=your-secure-password

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain
BLOCKCHAIN_NETWORK=mainnet
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your-project-id
BLOCKCHAIN_PRIVATE_KEY=your-private-key
CONTRACT_ADDRESS=0x...

# File Upload
UPLOAD_PATH=/var/uploads
MAX_FILE_SIZE=5242880

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# External APIs
MAPS_API_KEY=your-google-maps-api-key
CURRENCY_API_KEY=your-currency-api-key

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/vanguard/app.log
```

#### Client (.env.production)
```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Vanguard
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=your-sentry-dsn
```

## Database Setup

### 1. Create Production Database
```sql
CREATE DATABASE vanguard_prod;
CREATE USER vanguard_prod_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE vanguard_prod TO vanguard_prod_user;

-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Run Migrations
```bash
cd server
NODE_ENV=production npm run migrate
```

### 3. Seed Initial Data (Optional)
```bash
# Only for staging/demo environments
NODE_ENV=production npm run seed
```

## Docker Deployment

### Dockerfile (Server)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# Copy source code
COPY server/ ./server/

# Create uploads directory
RUN mkdir -p /var/uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start server
CMD ["npm", "start"]
```

### Dockerfile (Client)
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci
RUN cd client && npm ci

# Copy source code
COPY client/ ./client/

# Build application
RUN cd client && npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:13-3.1
    environment:
      POSTGRES_DB: vanguard_prod
      POSTGRES_USER: vanguard_prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: Dockerfile.server
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    env_file:
      - server/.env
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"
    volumes:
      - uploads:/var/uploads
      - logs:/var/log/vanguard

  web:
    build:
      context: .
      dockerfile: Dockerfile.client
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:
```

## Kubernetes Deployment

### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vanguard
```

### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vanguard-config
  namespace: vanguard
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  REDIS_HOST: "redis-service"
  LOG_LEVEL: "info"
```

### Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: vanguard-secrets
  namespace: vanguard
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  BLOCKCHAIN_PRIVATE_KEY: <base64-encoded-key>
```

### Deployment (API)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vanguard-api
  namespace: vanguard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vanguard-api
  template:
    metadata:
      labels:
        app: vanguard-api
    spec:
      containers:
      - name: api
        image: vanguard/api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: vanguard-config
        - secretRef:
            name: vanguard-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: vanguard-api-service
  namespace: vanguard
spec:
  selector:
    app: vanguard-api
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vanguard-ingress
  namespace: vanguard
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    - app.yourdomain.com
    secretName: vanguard-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vanguard-api-service
            port:
              number: 80
  - host: app.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vanguard-web-service
            port:
              number: 80
```

## Cloud Deployment Options

### AWS
- **Compute**: ECS Fargate or EKS
- **Database**: RDS PostgreSQL with PostGIS
- **Cache**: ElastiCache Redis
- **Storage**: S3 for file uploads
- **CDN**: CloudFront
- **Load Balancer**: Application Load Balancer
- **Monitoring**: CloudWatch

### Google Cloud Platform
- **Compute**: Cloud Run or GKE
- **Database**: Cloud SQL PostgreSQL
- **Cache**: Memorystore Redis
- **Storage**: Cloud Storage
- **CDN**: Cloud CDN
- **Load Balancer**: Cloud Load Balancing
- **Monitoring**: Cloud Monitoring

### Azure
- **Compute**: Container Instances or AKS
- **Database**: Azure Database for PostgreSQL
- **Cache**: Azure Cache for Redis
- **Storage**: Blob Storage
- **CDN**: Azure CDN
- **Load Balancer**: Application Gateway
- **Monitoring**: Azure Monitor

## Security Considerations

### 1. Network Security
- Use HTTPS/TLS 1.3 for all communications
- Implement proper CORS policies
- Use Web Application Firewall (WAF)
- Enable DDoS protection

### 2. Database Security
- Use connection pooling with SSL
- Implement database encryption at rest
- Regular security updates
- Backup encryption

### 3. Application Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- Security headers

### 4. Blockchain Security
- Secure private key management (HSM/KMS)
- Multi-signature wallets for critical operations
- Gas optimization
- Smart contract auditing

## Monitoring and Logging

### Application Monitoring
```javascript
// server/utils/monitoring.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const tokenValidations = new prometheus.Counter({
  name: 'token_validations_total',
  help: 'Total number of token validations',
  labelNames: ['status', 'manufacturer']
});

module.exports = {
  httpRequestDuration,
  tokenValidations
};
```

### Health Checks
```javascript
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {
      database: 'OK',
      redis: 'OK',
      blockchain: 'OK'
    }
  };

  try {
    // Database check
    await db.raw('SELECT 1');
    
    // Redis check
    await redis.ping();
    
    // Blockchain check
    if (blockchainService.web3) {
      await blockchainService.web3.eth.getBlockNumber();
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/var/backups/vanguard"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="vanguard_backup_${DATE}.sql"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "${BACKUP_DIR}/${BACKUP_FILE}"
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" s3://your-backup-bucket/database/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Strategy**: Daily full backups, hourly incremental
4. **Multi-region deployment** for high availability
5. **Automated failover** procedures

## Performance Optimization

### Database Optimization
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas for analytics

### Application Optimization
- Response caching
- Image optimization
- Code splitting
- CDN usage

### Monitoring Metrics
- Response time < 200ms (95th percentile)
- Uptime > 99.9%
- Error rate < 0.1%
- Token validation success rate > 99%

## Maintenance

### Regular Tasks
- Security updates
- Database maintenance
- Log rotation
- Certificate renewal
- Backup verification

### Scaling Considerations
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture for complex features
- Auto-scaling based on metrics

This deployment guide provides a comprehensive approach to deploying the Vanguard system in production environments with proper security, monitoring, and scalability considerations.