# Verifi System Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for development)
- PostgreSQL 14+ (if running without Docker)
- Redis 6+ (if running without Docker)

### 1. Clone and Setup
```bash
git clone https://github.com/Reshigan/vanguard-complete-system.git
cd vanguard-complete-system
cp .env.verifi.example .env
```

### 2. Configure Environment
Edit the `.env` file with your specific configuration:
```bash
# Update these values for production
JWT_SECRET=your-super-secret-jwt-key
VERIFI_API_KEY=your-production-api-key
DATABASE_URL=your-database-url
```

### 3. Deploy with Docker
```bash
# Start all Verifi services
docker-compose -f docker-compose.verifi.yml up -d

# Check service status
docker-compose -f docker-compose.verifi.yml ps

# View logs
docker-compose -f docker-compose.verifi.yml logs -f
```

### 4. Access Applications
- **Verifi Guard (Consumer)**: http://localhost:52690/verifi/guard
- **Verifi Enterprise (Manufacturer)**: http://localhost:52690/verifi/enterprise
- **Verifi Intelligence (Association)**: http://localhost:52690/verifi/intelligence
- **API Documentation**: http://localhost:55222/api/verifi/health

## Production Deployment

### 1. Server Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+ recommended
- **Storage**: 100GB+ SSD
- **Network**: High-speed internet connection
- **OS**: Ubuntu 20.04+ or CentOS 8+

### 2. Security Configuration
```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY

# Set up SSL certificates
sudo certbot --nginx -d your-domain.com
```

### 3. Database Setup
```sql
-- Create production database
CREATE DATABASE verifi_production;
CREATE USER verifi_prod WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE verifi_production TO verifi_prod;

-- Run migrations
npm run migrate:prod
```

### 4. Environment Variables
```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://verifi_prod:secure_password@localhost:5432/verifi_production
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-generated-secret
VERIFI_API_KEY=your-production-api-key
```

### 5. Process Management
```bash
# Using PM2 for production
npm install -g pm2

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Service Architecture

### Core Services
1. **verifi-client**: React frontend application
2. **verifi-server**: Node.js API server
3. **verifi-db**: PostgreSQL database
4. **verifi-redis**: Redis cache
5. **verifi-blockchain**: Blockchain node
6. **verifi-ai**: AI/ML processing service
7. **verifi-nginx**: Reverse proxy

### Service Dependencies
```
verifi-nginx → verifi-client → verifi-server → verifi-db
                                           → verifi-redis
                                           → verifi-blockchain
                                           → verifi-ai
```

## API Endpoints

### Consumer App APIs
```
POST /api/verifi/consumer/validate-token
GET  /api/verifi/consumer/rewards/:userId
POST /api/verifi/consumer/report-counterfeit
```

### Manufacturer App APIs
```
GET  /api/verifi/manufacturer/analytics/:manufacturerId
GET  /api/verifi/manufacturer/batches/:manufacturerId
POST /api/verifi/manufacturer/batches
GET  /api/verifi/manufacturer/ai-insights/:manufacturerId
```

### Association App APIs
```
GET  /api/verifi/association/industry-analytics
GET  /api/verifi/association/trend-analysis
GET  /api/verifi/association/investigations
POST /api/verifi/association/investigations
```

## Monitoring & Health Checks

### Health Check Endpoints
```bash
# System health
curl http://localhost:55222/api/verifi/health

# Service statistics
curl -H "x-api-key: your-api-key" http://localhost:55222/api/verifi/stats
```

### Monitoring Setup
```bash
# Install monitoring tools
docker run -d --name prometheus prom/prometheus
docker run -d --name grafana grafana/grafana

# Configure alerts
# See monitoring/alerts.yml
```

## Backup & Recovery

### Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump verifi_production > backups/verifi_backup_$DATE.sql
```

### Redis Backup
```bash
# Redis persistence
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb backups/redis_backup_$(date +%Y%m%d).rdb
```

### File System Backup
```bash
# Backup uploaded files and logs
tar -czf backups/files_$(date +%Y%m%d).tar.gz uploads/ logs/
```

## Scaling & Performance

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  verifi-server:
    deploy:
      replicas: 3
  
  verifi-nginx:
    depends_on:
      - verifi-server
```

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_tokens_batch_id ON tokens(batch_id);
CREATE INDEX idx_scans_timestamp ON scans(timestamp);
CREATE INDEX idx_investigations_status ON investigations(status);
```

### Caching Strategy
```javascript
// Redis caching configuration
const cacheConfig = {
  analytics: 300,      // 5 minutes
  userRewards: 600,    // 10 minutes
  systemStats: 60      // 1 minute
};
```

## Security Best Practices

### 1. API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use API keys for authentication

### 2. Database Security
- Use connection pooling
- Encrypt sensitive data
- Regular security updates
- Backup encryption

### 3. Application Security
- Regular dependency updates
- Security headers
- CORS configuration
- Input sanitization

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.verifi.yml logs verifi-db

# Test connection
psql -h localhost -U verifi_user -d verifi_db
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
docker-compose -f docker-compose.verifi.yml logs verifi-redis

# Test connection
redis-cli ping
```

#### 3. API Authentication Issues
```bash
# Verify API key
curl -H "x-api-key: verifi-demo-key-2024" http://localhost:55222/api/verifi/health
```

#### 4. Frontend Build Issues
```bash
# Rebuild client
cd client
npm install
npm run build
```

### Log Analysis
```bash
# View application logs
docker-compose -f docker-compose.verifi.yml logs -f verifi-server

# View specific service logs
docker logs verifi-server-container-name

# Search logs for errors
grep -i error logs/verifi.log
```

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Backup database daily
- [ ] Monitor disk space
- [ ] Review security logs
- [ ] Update SSL certificates
- [ ] Performance monitoring

### Update Procedure
```bash
# 1. Backup current system
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
npm install

# 4. Run migrations
npm run migrate

# 5. Restart services
docker-compose -f docker-compose.verifi.yml restart
```

## Support & Documentation

### Getting Help
- **Documentation**: See VERIFI_SYSTEM_DOCUMENTATION.md
- **API Reference**: http://localhost:55222/api/docs
- **Issues**: Create GitHub issue
- **Email**: support@verifi-system.com

### Development Setup
```bash
# Development environment
npm run dev:setup
npm run dev:start

# Run tests
npm run test:verifi

# Code quality
npm run lint
npm run format
```

---

**Verifi System - Production Ready Deployment**

*Comprehensive anti-counterfeiting solution for the alcohol industry*