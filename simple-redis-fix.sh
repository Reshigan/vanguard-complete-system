#!/bin/bash

# Simple Redis Fix for Ubuntu 24.04
# This creates a minimal, working Redis configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

REDIS_PASSWORD="vantax"

print_status "Simple Redis Fix for Ubuntu 24.04"

# Stop Redis
print_status "Stopping Redis..."
sudo systemctl stop redis-server 2>/dev/null || true

# Ensure Redis user exists
if ! id redis >/dev/null 2>&1; then
    print_status "Creating Redis user..."
    sudo useradd --system --home /var/lib/redis --shell /bin/false redis
fi

# Create directories
print_status "Creating Redis directories..."
sudo mkdir -p /var/lib/redis /var/log/redis /run/redis
sudo chown redis:redis /var/lib/redis /var/log/redis /run/redis
sudo chmod 755 /var/lib/redis /var/log/redis /run/redis

# Create a SIMPLE working Redis config
print_status "Creating simple Redis configuration..."
sudo tee /etc/redis/redis.conf > /dev/null << 'EOF'
# Simple Redis Configuration
bind 127.0.0.1
port 6379
daemonize yes
pidfile /run/redis/redis-server.pid
logfile /var/log/redis/redis-server.log
dir /var/lib/redis
requirepass vantax
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

# Set permissions
sudo chown redis:redis /etc/redis/redis.conf
sudo chmod 640 /etc/redis/redis.conf

# Test the simple config
print_status "Testing Redis configuration..."
if sudo -u redis redis-server /etc/redis/redis.conf --test-config; then
    print_success "Redis configuration is valid"
else
    print_error "Redis configuration test failed"
    exit 1
fi

# Start Redis
print_status "Starting Redis..."
sudo systemctl daemon-reload
sudo systemctl start redis-server

# Wait a moment
sleep 3

# Test connection
print_status "Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    print_success "Redis is working!"
    
    # Show Redis info
    echo -e "\n${GREEN}Redis Configuration:${NC}"
    echo -e "Host: ${BLUE}localhost${NC}"
    echo -e "Port: ${BLUE}6379${NC}"
    echo -e "Password: ${BLUE}$REDIS_PASSWORD${NC}"
    
    # Test some Redis commands
    print_status "Testing Redis commands..."
    redis-cli -a "$REDIS_PASSWORD" SET test "Hello World"
    RESULT=$(redis-cli -a "$REDIS_PASSWORD" GET test)
    echo "Test result: $RESULT"
    redis-cli -a "$REDIS_PASSWORD" DEL test
    
    print_success "Redis is fully functional!"
    
else
    print_error "Redis connection failed"
    print_status "Checking Redis status..."
    sudo systemctl status redis-server --no-pager
    print_status "Checking Redis logs..."
    sudo journalctl -u redis-server -n 20 --no-pager
    exit 1
fi

# Enable Redis to start on boot
sudo systemctl enable redis-server

print_success "Redis setup completed successfully!"
echo -e "\n${YELLOW}Redis is now running with password: $REDIS_PASSWORD${NC}"