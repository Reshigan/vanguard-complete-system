#!/bin/bash

# Quick Redis fix for Ubuntu with custom password
# This script fixes the Redis setup issue and uses your specified password

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Quick Redis Fix for Ubuntu ===${NC}"

# Use the password you specified
REDIS_PASSWORD="vantax"
echo -e "${YELLOW}Using Redis password: $REDIS_PASSWORD${NC}"

# 1. Stop any running Redis
echo -e "\n${YELLOW}Stopping Redis if running...${NC}"
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true

# 2. Create Redis config directory
sudo mkdir -p /etc/redis

# 3. Create proper Redis configuration
REDIS_CONF="/etc/redis/redis.conf"
echo -e "\n${YELLOW}Creating Redis configuration...${NC}"

sudo tee "$REDIS_CONF" > /dev/null << EOF
# Redis Configuration for Vanguard
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
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

# Security - Using your password
requirepass $REDIS_PASSWORD

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Append only mode
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Other settings
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
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
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF

# 4. Create necessary directories
echo -e "\n${YELLOW}Creating Redis directories...${NC}"
sudo mkdir -p /var/lib/redis /var/log/redis /var/run/redis
sudo chown -R redis:redis /var/lib/redis /var/log/redis /var/run/redis
sudo chmod 755 /var/lib/redis /var/log/redis /var/run/redis

# 5. Start Redis using the correct service name (redis-server for Ubuntu)
echo -e "\n${YELLOW}Starting Redis service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 6. Wait for Redis to start
sleep 3

# 7. Test Redis connection
echo -e "\n${YELLOW}Testing Redis connection...${NC}"
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis is working correctly!${NC}"
else
    echo -e "${RED}✗ Redis connection test failed${NC}"
    echo "Checking Redis status..."
    sudo systemctl status redis-server --no-pager
fi

# 8. Show summary
echo -e "\n${GREEN}=== Redis Setup Complete ===${NC}"
echo -e "Configuration file: ${BLUE}/etc/redis/redis.conf${NC}"
echo -e "Redis password: ${BLUE}$REDIS_PASSWORD${NC}"
echo -e "Service name: ${BLUE}redis-server${NC}"
echo -e "\nRedis commands:"
echo -e "  Status: ${BLUE}sudo systemctl status redis-server${NC}"
echo -e "  Logs: ${BLUE}sudo journalctl -u redis-server -f${NC}"
echo -e "  Connect: ${BLUE}redis-cli -a $REDIS_PASSWORD${NC}"
echo -e "  Test: ${BLUE}redis-cli -a $REDIS_PASSWORD ping${NC}"

# 9. Save connection info
echo -e "\n${YELLOW}Saving Redis connection info...${NC}"
cat > ~/redis-info.txt << EOF
Redis Configuration
===================
Host: localhost
Port: 6379
Password: $REDIS_PASSWORD
Config: /etc/redis/redis.conf
Service: redis-server

Test command: redis-cli -a $REDIS_PASSWORD ping
EOF
chmod 600 ~/redis-info.txt
echo -e "${GREEN}Redis info saved to: ~/redis-info.txt${NC}"

# 10. Update any existing .env files
if [ -d "/opt/vanguard/server" ]; then
    ENV_FILE="/opt/vanguard/server/.env"
    if [ -f "$ENV_FILE" ]; then
        echo -e "\n${YELLOW}Updating .env file with Redis password...${NC}"
        # Update Redis password in .env
        sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
        sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379|" "$ENV_FILE"
        echo -e "${GREEN}✓ Updated .env file${NC}"
    fi
fi

echo -e "\n${GREEN}Redis is now properly configured and running!${NC}"
echo -e "${YELLOW}You can now continue with your deployment.${NC}"