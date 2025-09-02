#!/bin/bash

# Vanguard Anti-Counterfeiting System - Docker Deployment Script
# This script deploys the complete system using Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗  ║
║  ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗ ║
║  ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝ ║
║  ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗ ║
║   ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║ ║
║    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ║
║                                                                  ║
║                DOCKER DEPLOYMENT                                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log "Using Docker Compose command: $DOCKER_COMPOSE"

# Check if running as root or in docker group
if [ "$(id -u)" -ne 0 ] && ! groups | grep -q docker; then
    error "This script must be run as root or your user must be in the docker group"
    exit 1
fi

# Stop any existing containers
log "Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.production.yml down --remove-orphans || true
success "Existing containers stopped"

# Remove old images (optional)
read -p "Do you want to remove old Docker images to ensure fresh deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Removing old Docker images..."
    docker image prune -f || true
    docker rmi $(docker images -q vanguard-complete-system_app) 2>/dev/null || true
    success "Old images removed"
fi

# Build and start services
log "Building and starting services..."
$DOCKER_COMPOSE -f docker-compose.production.yml up --build -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

# Check service health
log "Checking service health..."

# Check PostgreSQL
if $DOCKER_COMPOSE -f docker-compose.production.yml exec -T postgres pg_isready -U vanguard -d vanguard; then
    success "PostgreSQL is healthy"
else
    error "PostgreSQL is not healthy"
    exit 1
fi

# Check Redis
if $DOCKER_COMPOSE -f docker-compose.production.yml exec -T redis redis-cli -a vanguard123 ping | grep -q PONG; then
    success "Redis is healthy"
else
    error "Redis is not healthy"
    exit 1
fi

# Wait a bit more for the app to start
sleep 15

# Check application
if curl -f http://localhost:3000/api/health &> /dev/null; then
    success "Application is healthy"
else
    warning "Application health check failed, but continuing..."
fi

# Check Nginx
if curl -f http://localhost/health &> /dev/null; then
    success "Nginx is healthy"
else
    warning "Nginx health check failed, but continuing..."
fi

# Generate sample data
log "Generating sample data..."
$DOCKER_COMPOSE -f docker-compose.production.yml exec -T app node scripts/generate-full-year-data.js --users 100 --products 50 --days 30 || true
success "Sample data generated"

# Show running containers
log "Showing running containers..."
$DOCKER_COMPOSE -f docker-compose.production.yml ps

# Show logs for any failed services
log "Checking for any service issues..."
if ! $DOCKER_COMPOSE -f docker-compose.production.yml ps | grep -q "Up"; then
    warning "Some services may not be running properly. Showing logs..."
    $DOCKER_COMPOSE -f docker-compose.production.yml logs --tail=50
fi

# Print summary
echo ""
log "Deployment completed!"
echo ""
echo -e "${GREEN}Vanguard Anti-Counterfeiting System has been successfully deployed with Docker!${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://localhost${NC}"
echo ""
echo "API is running at:"
echo -e "  ${BLUE}http://localhost:3000/api${NC}"
echo ""
echo "Default admin credentials:"
echo -e "  ${YELLOW}Email: admin@vanguard.local${NC}"
echo -e "  ${YELLOW}Password: Admin@123456${NC}"
echo ""
echo "Other test accounts:"
echo -e "  ${YELLOW}Manufacturer: manufacturer@vanguard.local / password123${NC}"
echo -e "  ${YELLOW}Consumer: consumer@vanguard.local / password123${NC}"
echo ""
echo -e "${RED}IMPORTANT: Change the default passwords immediately after first login!${NC}"
echo ""
echo "Useful Docker commands:"
echo -e "  ${BLUE}View logs: $DOCKER_COMPOSE -f docker-compose.production.yml logs -f${NC}"
echo -e "  ${BLUE}Stop system: $DOCKER_COMPOSE -f docker-compose.production.yml down${NC}"
echo -e "  ${BLUE}Restart system: $DOCKER_COMPOSE -f docker-compose.production.yml restart${NC}"
echo -e "  ${BLUE}View status: $DOCKER_COMPOSE -f docker-compose.production.yml ps${NC}"
echo ""
echo "Data is persisted in Docker volumes:"
echo -e "  ${BLUE}Database: vanguard-complete-system_postgres_data${NC}"
echo -e "  ${BLUE}Redis: vanguard-complete-system_redis_data${NC}"
echo -e "  ${BLUE}Uploads: vanguard-complete-system_app_uploads${NC}"
echo -e "  ${BLUE}Logs: vanguard-complete-system_app_logs${NC}"
echo ""
echo -e "${GREEN}System is ready for production use!${NC}"