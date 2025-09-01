#!/bin/bash

# Ultra Simple Redis Fix for Ubuntu 24.04
# This creates the most minimal Redis configuration possible

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

print_status "Ultra Simple Redis Fix for Ubuntu 24.04"

# Stop Redis completely
print_status "Stopping all Redis processes..."
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true
sudo pkill -f redis-server 2>/dev/null || true

# Remove any existing config that might be corrupted
print_status "Removing existing Redis configuration..."
sudo rm -f /etc/redis/redis.conf
sudo rm -f /etc/redis.conf

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

# Create the most minimal Redis config possible
print_status "Creating ultra-minimal Redis configuration..."
sudo mkdir -p /etc/redis

# Write config line by line to avoid any hidden characters
sudo bash -c 'cat > /etc/redis/redis.conf << "EOF"
bind 127.0.0.1
port 6379
daemonize yes
pidfile /run/redis/redis-server.pid
logfile /var/log/redis/redis-server.log
dir /var/lib/redis
requirepass vantax
EOF'

# Set permissions
sudo chown redis:redis /etc/redis/redis.conf
sudo chmod 640 /etc/redis/redis.conf

# Show the config to verify
print_status "Verifying Redis configuration content..."
echo "Config file contents:"
sudo cat /etc/redis/redis.conf
echo "--- End of config ---"

# Test the config
print_status "Testing Redis configuration..."
if sudo -u redis redis-server /etc/redis/redis.conf --test-config; then
    print_success "Redis configuration is valid"
else
    print_error "Redis configuration test failed"
    print_status "Let's try an even simpler approach..."
    
    # Create absolute minimal config
    sudo bash -c 'cat > /etc/redis/redis.conf << "EOF"
port 6379
requirepass vantax
EOF'
    
    sudo chown redis:redis /etc/redis/redis.conf
    sudo chmod 640 /etc/redis/redis.conf
    
    print_status "Testing minimal configuration..."
    if sudo -u redis redis-server /etc/redis/redis.conf --test-config; then
        print_success "Minimal Redis configuration is valid"
    else
        print_error "Even minimal config failed. Let's check Redis installation..."
        redis-server --version
        which redis-server
        exit 1
    fi
fi

# Start Redis
print_status "Starting Redis..."
sudo systemctl daemon-reload
sudo systemctl start redis-server

# Wait for Redis to start
sleep 5

# Check if Redis is running
print_status "Checking if Redis is running..."
if pgrep -f redis-server > /dev/null; then
    print_success "Redis process is running"
else
    print_error "Redis process not found"
    print_status "Checking systemd status..."
    sudo systemctl status redis-server --no-pager
    exit 1
fi

# Test connection
print_status "Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    print_success "Redis is working perfectly!"
    
    # Test basic operations
    print_status "Testing Redis operations..."
    redis-cli -a "$REDIS_PASSWORD" SET test "Hello World" > /dev/null
    RESULT=$(redis-cli -a "$REDIS_PASSWORD" GET test 2>/dev/null)
    if [ "$RESULT" = "Hello World" ]; then
        print_success "Redis operations working"
        redis-cli -a "$REDIS_PASSWORD" DEL test > /dev/null
    else
        print_error "Redis operations failed"
    fi
    
    # Show Redis info
    echo -e "\n${GREEN}Redis is now working!${NC}"
    echo -e "Host: ${BLUE}localhost${NC}"
    echo -e "Port: ${BLUE}6379${NC}"
    echo -e "Password: ${BLUE}$REDIS_PASSWORD${NC}"
    
    # Enable Redis to start on boot
    sudo systemctl enable redis-server
    
    print_success "Redis setup completed successfully!"
    
else
    print_error "Redis connection failed"
    print_status "Debugging information:"
    echo "Redis process:"
    ps aux | grep redis
    echo "Redis port:"
    sudo netstat -tlnp | grep 6379 || echo "Port 6379 not listening"
    echo "Redis logs:"
    sudo tail -20 /var/log/redis/redis-server.log 2>/dev/null || echo "No Redis logs found"
    echo "Systemd status:"
    sudo systemctl status redis-server --no-pager
    exit 1
fi