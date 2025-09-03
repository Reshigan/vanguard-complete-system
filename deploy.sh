#!/bin/bash

# Verifi AI Deployment Script
# This script handles the complete deployment of the Verifi AI system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="compose.yaml"
PRODUCTION_COMPOSE_FILE="docker-compose.production.yml"

echo -e "${BLUE}🚀 Verifi AI Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if required files exist
check_files() {
    local required_files=(
        "server/package.json"
        "server/index.js"
        "server/migrations/001_initial_schema.sql"
        "server/migrations/002_seed_data.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "Required file $file not found"
            exit 1
        fi
    done
    
    print_status "All required files are present"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment for: $ENVIRONMENT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ ! -f ".env.production" ]]; then
            print_warning "Production environment file not found"
            print_info "Copying .env.production.example to .env.production"
            cp .env.production.example .env.production
            print_warning "Please edit .env.production with your production values before continuing"
            read -p "Press Enter to continue after editing .env.production..."
        fi
        COMPOSE_FILE=$PRODUCTION_COMPOSE_FILE
    else
        if [[ ! -f ".env" ]]; then
            print_info "Creating development environment file"
            cat > .env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://verifi:verifi123@localhost:5432/verifi_ai
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-change-in-production
ENABLE_ML_WORKER=true
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
EOF
        fi
    fi
    
    print_status "Environment configured for $ENVIRONMENT"
}

# Build and start services
deploy_services() {
    print_info "Building and starting services..."
    
    # Stop existing services
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f $COMPOSE_FILE down --remove-orphans || true
    else
        docker-compose -f $COMPOSE_FILE down --remove-orphans || true
    fi
    
    # Build and start services
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_info "Starting production services..."
        docker-compose -f $COMPOSE_FILE up -d --build
    else
        print_info "Starting development services..."
        docker-compose -f $COMPOSE_FILE up -d --build
    fi
    
    print_status "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    # Wait for database
    print_info "Waiting for database..."
    timeout=60
    while ! docker-compose -f $COMPOSE_FILE exec -T verifi-ai-db pg_isready -U verifi -d verifi_ai &>/dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            print_error "Database failed to start within 60 seconds"
            exit 1
        fi
    done
    print_status "Database is ready"
    
    # Wait for Redis
    print_info "Waiting for Redis..."
    timeout=30
    while ! docker-compose -f $COMPOSE_FILE exec -T verifi-ai-redis redis-cli ping &>/dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            print_error "Redis failed to start within 30 seconds"
            exit 1
        fi
    done
    print_status "Redis is ready"
    
    # Wait for API server
    print_info "Waiting for API server..."
    timeout=60
    while ! curl -f -s http://localhost:3001/api/health &>/dev/null; do
        sleep 3
        timeout=$((timeout - 3))
        if [[ $timeout -le 0 ]]; then
            print_error "API server failed to start within 60 seconds"
            docker-compose -f $COMPOSE_FILE logs verifi-ai-server
            exit 1
        fi
    done
    print_status "API server is ready"
}

# Run tests
run_tests() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        print_info "Running basic health checks..."
        
        # Test API endpoints
        if curl -f -s http://localhost:3001/api/health > /dev/null; then
            print_status "API health check passed"
        else
            print_error "API health check failed"
            return 1
        fi
        
        # Test database connection
        if docker-compose -f $COMPOSE_FILE exec -T verifi-ai-server node -e "
            const { Pool } = require('pg');
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            pool.query('SELECT 1').then(() => {
                console.log('Database connection successful');
                process.exit(0);
            }).catch(err => {
                console.error('Database connection failed:', err);
                process.exit(1);
            });
        "; then
            print_status "Database connection test passed"
        else
            print_error "Database connection test failed"
            return 1
        fi
        
        print_status "All tests passed"
    else
        print_info "Skipping tests in production mode"
    fi
}

# Show deployment status
show_status() {
    print_info "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    # Show service URLs
    print_info "Service URLs:"
    echo "🌐 API Server: http://localhost:3001"
    echo "🌐 Consumer Portal: http://localhost:3001/consumer"
    echo "🌐 Manufacturer Portal: http://localhost:3001/manufacturer"
    echo "🌐 Admin Portal: http://localhost:3001/admin"
    echo "📊 Database: localhost:5432"
    echo "🔴 Redis: localhost:6379"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "🔒 HTTPS: https://localhost (if SSL configured)"
    fi
    
    echo ""
    print_info "Useful Commands:"
    echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "🔄 Restart services: docker-compose -f $COMPOSE_FILE restart"
    echo "🛑 Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "🧹 Clean up: docker-compose -f $COMPOSE_FILE down -v --remove-orphans"
}

# Backup function
backup_data() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_info "Creating backup..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        docker-compose -f $COMPOSE_FILE exec -T verifi-ai-db pg_dump -U verifi verifi_ai > "$BACKUP_DIR/database.sql"
        
        # Backup uploaded files
        docker cp $(docker-compose -f $COMPOSE_FILE ps -q verifi-ai-server):/app/uploads "$BACKUP_DIR/"
        
        print_status "Backup created in $BACKUP_DIR"
    fi
}

# Main deployment function
main() {
    print_info "Starting deployment for environment: $ENVIRONMENT"
    
    # Pre-deployment checks
    check_docker
    check_files
    
    # Setup and deploy
    setup_environment
    
    # Create backup if production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backup_data
    fi
    
    deploy_services
    wait_for_services
    
    # Run tests
    if ! run_tests; then
        print_error "Tests failed. Check the logs for details."
        docker-compose -f $COMPOSE_FILE logs
        exit 1
    fi
    
    # Show final status
    show_status
    
    print_status "🎉 Verifi AI deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        print_info "You can now access the application at http://localhost:3001"
        print_info "Try the demo by visiting http://localhost:3001/consumer"
    fi
}

# Handle script arguments
case "${1:-}" in
    "production")
        main
        ;;
    "development"|"dev"|"")
        ENVIRONMENT="development"
        main
        ;;
    "test")
        ENVIRONMENT="test"
        main
        ;;
    "stop")
        print_info "Stopping all services..."
        docker-compose -f $COMPOSE_FILE down
        print_status "All services stopped"
        ;;
    "clean")
        print_info "Cleaning up all containers and volumes..."
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed"
        ;;
    "logs")
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "status")
        docker-compose -f $COMPOSE_FILE ps
        ;;
    "backup")
        backup_data
        ;;
    *)
        echo "Usage: $0 {development|production|test|stop|clean|logs|status|backup}"
        echo ""
        echo "Commands:"
        echo "  development  - Deploy in development mode (default)"
        echo "  production   - Deploy in production mode"
        echo "  test         - Deploy in test mode"
        echo "  stop         - Stop all services"
        echo "  clean        - Stop services and remove volumes"
        echo "  logs         - Show service logs"
        echo "  status       - Show service status"
        echo "  backup       - Create backup (production only)"
        exit 1
        ;;
esac