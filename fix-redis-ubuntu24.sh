#!/bin/bash

# Redis Fix Script for Ubuntu 24.04
# This script diagnoses and fixes Redis startup issues

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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

REDIS_PASSWORD="vantax"

print_status "Diagnosing Redis issues on Ubuntu 24.04..."

# Stop Redis if running
print_status "Stopping Redis service..."
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true

# Check what's wrong
print_status "Checking Redis service status..."
sudo systemctl status redis-server --no-pager || true

print_status "Checking Redis logs..."
sudo journalctl -u redis-server -n 20 --no-pager || true

# Check Redis installation
print_status "Checking Redis installation..."
redis-server --version

# Check existing config
print_status "Checking existing Redis configuration..."
if [ -f /etc/redis/redis.conf ]; then
    print_info "Found Redis config at /etc/redis/redis.conf"
    ls -la /etc/redis/redis.conf
else
    print_warning "No Redis config found at /etc/redis/redis.conf"
fi

# Check Redis user
print_status "Checking Redis user..."
if id redis >/dev/null 2>&1; then
    print_success "Redis user exists"
    id redis
else
    print_error "Redis user does not exist"
    print_status "Creating Redis user..."
    sudo useradd --system --home /var/lib/redis --shell /bin/false redis
fi

# Remove old config and start fresh
print_status "Creating fresh Redis configuration..."
sudo rm -f /etc/redis/redis.conf

# Create Redis directories with proper permissions
print_status "Creating Redis directories..."
sudo mkdir -p /etc/redis
sudo mkdir -p /var/lib/redis
sudo mkdir -p /var/log/redis
sudo mkdir -p /run/redis

# Set ownership
sudo chown redis:redis /var/lib/redis
sudo chown redis:redis /var/log/redis
sudo chown redis:redis /run/redis
sudo chmod 755 /var/lib/redis
sudo chmod 755 /var/log/redis
sudo chmod 755 /run/redis

# Create a working Redis configuration
print_status "Creating Redis configuration..."
sudo tee /etc/redis/redis.conf > /dev/null << 'EOF'
# Redis configuration for Ubuntu 24.04
# Basic settings
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General
daemonize yes
supervised systemd
pidfile /run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Replication
replica-serve-stale-data yes
replica-read-only yes

# Security
requirepass vantax

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Append only file
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency monitor
latency-monitor-threshold 0

# Event notification
notify-keyspace-events ""

# Hash settings
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100

# Active rehashing
activerehashing yes

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Client query buffer limit
client-query-buffer-limit 1gb

# Protocol max bulk length
proto-max-bulk-len 512mb

# Hz
hz 10
dynamic-hz yes

# AOF rewrite
aof-rewrite-incremental-fsync yes

# RDB
rdb-save-incremental-fsync yes

# Jemalloc
jemalloc-bg-thread yes

# Disable some features that might cause issues
always-show-logo no
EOF

# Set proper permissions on config file
sudo chown redis:redis /etc/redis/redis.conf
sudo chmod 640 /etc/redis/redis.conf

# Check if systemd service file exists and is correct
print_status "Checking Redis systemd service..."
if [ -f /lib/systemd/system/redis-server.service ]; then
    print_info "Redis service file exists"
else
    print_warning "Creating Redis systemd service file..."
    sudo tee /lib/systemd/system/redis-server.service > /dev/null << 'EOF'
[Unit]
Description=Advanced key-value store
After=network.target
Documentation=http://redis.io/documentation, man:redis-server(1)

[Service]
Type=notify
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/bin/redis-cli shutdown
TimeoutStopSec=0
Restart=always
User=redis
Group=redis
RuntimeDirectory=redis
RuntimeDirectoryMode=0755

UMask=007
PrivateTmp=yes
LimitNOFILE=65535
PrivateDevices=yes
ProtectHome=yes
ReadOnlyPaths=/
ReadWritePaths=-/var/lib/redis
ReadWritePaths=-/var/log/redis
ReadWritePaths=-/run/redis

NoNewPrivileges=true
CapabilityBoundingSet=CAP_SETGID CAP_SETUID CAP_SYS_RESOURCE
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=true
LockPersonality=true
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictSUIDSGID=true
RemoveIPC=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
Alias=redis.service
EOF
fi

# Reload systemd
print_status "Reloading systemd..."
sudo systemctl daemon-reload

# Test Redis configuration
print_status "Testing Redis configuration..."
sudo -u redis redis-server /etc/redis/redis.conf --test-config

# Enable and start Redis
print_status "Starting Redis service..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Wait for Redis to start
sleep 3

# Check Redis status
print_status "Checking Redis status..."
sudo systemctl status redis-server --no-pager

# Test Redis connection
print_status "Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    print_success "Redis is working correctly!"
    
    # Show Redis info
    print_info "Redis server info:"
    redis-cli -a "$REDIS_PASSWORD" INFO server | head -10
    
    print_success "Redis setup completed successfully!"
    echo -e "\n${GREEN}Redis Configuration:${NC}"
    echo -e "Host: ${BLUE}localhost${NC}"
    echo -e "Port: ${BLUE}6379${NC}"
    echo -e "Password: ${BLUE}$REDIS_PASSWORD${NC}"
    echo -e "Config: ${BLUE}/etc/redis/redis.conf${NC}"
    echo -e "Logs: ${BLUE}/var/log/redis/redis-server.log${NC}"
    echo -e "Data: ${BLUE}/var/lib/redis${NC}"
    
else
    print_error "Redis connection test failed!"
    print_status "Checking Redis logs for errors..."
    sudo journalctl -u redis-server -n 50 --no-pager
    
    print_status "Checking Redis process..."
    ps aux | grep redis
    
    print_status "Checking Redis ports..."
    sudo netstat -tlnp | grep 6379 || echo "Redis not listening on port 6379"
    
    exit 1
fi

# Save Redis info
cat > ~/redis-connection-info.txt << EOF
Redis Connection Information
============================
Host: localhost
Port: 6379
Password: $REDIS_PASSWORD

Test connection:
redis-cli -a $REDIS_PASSWORD ping

Service commands:
sudo systemctl status redis-server
sudo systemctl restart redis-server
sudo journalctl -u redis-server -f

Configuration: /etc/redis/redis.conf
Logs: /var/log/redis/redis-server.log
Data: /var/lib/redis
EOF

chmod 600 ~/redis-connection-info.txt
print_success "Redis connection info saved to ~/redis-connection-info.txt"

print_success "Redis fix completed successfully!"