#!/bin/bash

# Quick Redis fix for Ubuntu
echo "Fixing Redis configuration on Ubuntu..."

# Generate a secure Redis password if not set
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
echo "Using Redis password: $REDIS_PASSWORD"

# Find Redis config file
REDIS_CONF=""
for conf in "/etc/redis/redis.conf" "/etc/redis.conf" "/etc/redis/6379.conf"; do
    if [ -f "$conf" ]; then
        REDIS_CONF="$conf"
        echo "Found Redis config at: $REDIS_CONF"
        break
    fi
done

# If still not found, check with systemd
if [ -z "$REDIS_CONF" ]; then
    REDIS_CONF=$(sudo systemctl cat redis-server 2>/dev/null | grep -oP '(?<=redis-server\s)[^\s]*\.conf' | head -1)
    if [ -n "$REDIS_CONF" ] && [ -f "$REDIS_CONF" ]; then
        echo "Found Redis config from systemd: $REDIS_CONF"
    fi
fi

# Default to Ubuntu location if still not found
if [ -z "$REDIS_CONF" ] || [ ! -f "$REDIS_CONF" ]; then
    REDIS_CONF="/etc/redis/redis.conf"
    echo "Using default Ubuntu Redis config location: $REDIS_CONF"
fi

# Check if config exists
if [ ! -f "$REDIS_CONF" ]; then
    echo "ERROR: Redis config not found at $REDIS_CONF"
    echo "Creating directory and basic config..."
    sudo mkdir -p $(dirname "$REDIS_CONF")
    
    # Create a basic Redis config
    sudo tee "$REDIS_CONF" > /dev/null << EOCONF
# Redis Configuration for Vanguard
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
always-show-logo no
set-proc-title yes
proc-title-template "{title} {listen-addr} {server-mode}"

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Security
requirepass $REDIS_PASSWORD

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Append only mode
appendonly no
appendfilename "appendonly.aof"
appenddirname "appendonlydir"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
EOCONF
    echo "Created new Redis configuration"
else
    echo "Updating existing Redis configuration..."
    
    # Backup existing config
    sudo cp "$REDIS_CONF" "${REDIS_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update password
    if sudo grep -q "^requirepass" "$REDIS_CONF"; then
        sudo sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" "$REDIS_CONF"
    elif sudo grep -q "# requirepass foobared" "$REDIS_CONF"; then
        sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" "$REDIS_CONF"
    else
        echo -e "\n# Security\nrequirepass $REDIS_PASSWORD" | sudo tee -a "$REDIS_CONF" > /dev/null
    fi
    
    # Update memory settings
    if ! sudo grep -q "^maxmemory" "$REDIS_CONF"; then
        echo -e "\n# Memory Management\nmaxmemory 512mb\nmaxmemory-policy allkeys-lru" | sudo tee -a "$REDIS_CONF" > /dev/null
    fi
fi

# Create necessary directories
sudo mkdir -p /var/lib/redis /var/log/redis /var/run/redis
sudo chown redis:redis /var/lib/redis /var/log/redis /var/run/redis

# Restart Redis service
echo "Restarting Redis service..."
sudo systemctl restart redis-server || sudo systemctl restart redis

# Wait for Redis to start
sleep 2

# Test Redis connection
echo "Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✓ Redis is running and configured successfully!"
    echo ""
    echo "Redis Password: $REDIS_PASSWORD"
    echo "Redis Config: $REDIS_CONF"
    echo ""
    echo "Save this password for your .env file!"
else
    echo "✗ Redis test failed. Checking logs..."
    sudo journalctl -u redis-server -n 20 --no-pager
fi
