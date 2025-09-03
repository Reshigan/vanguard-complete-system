# Vanguard Anti-Counterfeiting System - Docker Deployment Guide

This guide provides instructions for deploying the complete Vanguard Anti-Counterfeiting System using Docker containers.

## Quick Start (Recommended)

For a complete installation including Docker setup:

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/install-docker.sh | sudo bash
```

## Manual Installation

### Prerequisites

- Linux server (Ubuntu 20.04+, CentOS 8+, or similar)
- Root access or sudo privileges
- At least 4GB RAM and 20GB disk space
- Internet connection for downloading Docker images

### Step 1: Install Docker and Docker Compose

If Docker is not installed:

```bash
# For Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# For CentOS/RHEL
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/Reshigan/vanguard-complete-system.git
cd vanguard-complete-system
```

### Step 3: Deploy with Docker

```bash
# Make the deployment script executable
chmod +x deploy-docker.sh

# Run the deployment
sudo ./deploy-docker.sh
```

## System Architecture

The Docker deployment includes the following services:

### Core Services

1. **PostgreSQL Database** (`postgres`)
   - Stores all application data
   - Persistent volume for data retention
   - Health checks enabled

2. **Redis Cache** (`redis`)
   - Handles caching and job queues
   - Password protected
   - Persistent volume for data retention

3. **Main Application** (`app`)
   - Node.js API server
   - Handles authentication, product verification, reporting
   - Auto-scaling with health checks

4. **ML Worker** (`ml-worker`)
   - Processes machine learning tasks
   - Anomaly detection and pattern analysis
   - Runs independently from main app

5. **Nginx Reverse Proxy** (`nginx`)
   - Serves static files
   - Proxies API requests
   - Rate limiting and security headers

## Configuration

### Environment Variables

The system uses the following key environment variables:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://vanguard:vanguard123@postgres:5432/vanguard
REDIS_URL=redis://:vanguard123@redis:6379
JWT_SECRET=your-jwt-secret-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Customization

To customize the deployment:

1. Edit `docker-compose.production.yml` for service configuration
2. Modify `nginx.conf` for web server settings
3. Update environment variables in the compose file

## Default Accounts

The system comes with pre-configured test accounts:

### Administrator
- **Email**: admin@vanguard.local
- **Password**: Admin@123456
- **Role**: System Administrator

### Manufacturer
- **Email**: manufacturer@vanguard.local
- **Password**: password123
- **Role**: Product Manufacturer

### Consumer
- **Email**: consumer@vanguard.local
- **Password**: password123
- **Role**: End Consumer

**⚠️ IMPORTANT**: Change all default passwords immediately after deployment!

## Accessing the System

Once deployed, the system is available at:

- **Web Interface**: http://localhost:8080
- **API Endpoints**: http://localhost:3001/api
- **Health Check**: http://localhost:8080/health

## Management Commands

### View System Status
```bash
docker-compose -f docker-compose.production.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f app
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart app
```

### Stop System
```bash
docker-compose -f docker-compose.production.yml down
```

### Update System
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up --build -d
```

## Data Persistence

The following data is persisted in Docker volumes:

- **Database**: `vanguard-complete-system_postgres_data`
- **Redis**: `vanguard-complete-system_redis_data`
- **File Uploads**: `vanguard-complete-system_app_uploads`
- **Application Logs**: `vanguard-complete-system_app_logs`
- **ML Models**: `vanguard-complete-system_app_data`

### Backup Data
```bash
# Backup database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U vanguard vanguard > backup.sql

# Backup volumes
docker run --rm -v vanguard-complete-system_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Security Features

### Built-in Security
- Rate limiting on API endpoints
- CORS protection
- Security headers (XSS, CSRF, etc.)
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token authentication

### Network Security
- Services communicate through internal Docker network
- Only necessary ports exposed to host
- Database and Redis not directly accessible from outside

### Recommendations
1. Use HTTPS in production (configure SSL certificates)
2. Change all default passwords
3. Set strong JWT secrets
4. Configure firewall rules
5. Regular security updates

## Monitoring and Health Checks

### Health Check Endpoints
- **Basic Health**: `/api/health`
- **Detailed Health**: `/api/health/detailed`
- **Readiness**: `/api/ready`
- **Liveness**: `/api/live`

### Monitoring
```bash
# Check service health
curl http://localhost:8080/api/health

# View resource usage
docker stats

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :80
   
   # Stop conflicting services
   sudo systemctl stop apache2  # or nginx
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose -f docker-compose.production.yml logs postgres
   
   # Restart database
   docker-compose -f docker-compose.production.yml restart postgres
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis logs
   docker-compose -f docker-compose.production.yml logs redis
   
   # Test Redis connection
   docker-compose -f docker-compose.production.yml exec redis redis-cli -a vanguard123 ping
   ```

4. **Application Not Starting**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.production.yml logs app
   
   # Rebuild application
   docker-compose -f docker-compose.production.yml up --build app
   ```

### Performance Tuning

For production environments:

1. **Increase Resources**
   ```yaml
   # In docker-compose.production.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '1.0'
   ```

2. **Scale Services**
   ```bash
   # Scale application instances
   docker-compose -f docker-compose.production.yml up --scale app=3 -d
   ```

3. **Database Optimization**
   - Increase PostgreSQL shared_buffers
   - Configure connection pooling
   - Set up read replicas for high load

## Production Deployment

For production deployment:

1. **Use HTTPS**
   - Configure SSL certificates
   - Update Nginx configuration
   - Redirect HTTP to HTTPS

2. **External Database** (Recommended)
   - Use managed PostgreSQL service
   - Configure connection pooling
   - Set up automated backups

3. **Load Balancing**
   - Use multiple application instances
   - Configure load balancer
   - Implement health checks

4. **Monitoring**
   - Set up application monitoring
   - Configure log aggregation
   - Implement alerting

## Support

For issues and support:

1. Check the logs first
2. Review this documentation
3. Check the GitHub repository issues
4. Contact the development team

## License

This project is licensed under the MIT License. See the LICENSE file for details.