#!/bin/bash

# Complete Redis fix for Ubuntu systems
# This handles the specific Ubuntu Redis setup issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Ubuntu Redis Complete Fix ===${NC}"

# 1. First, let's check the current Redis installation
echo -e "\n${YELLOW}Checking current Redis installation...${NC}"
redis-server --version

# 2. Stop Redis if running
echo -e "\n${YELLOW}Stopping Redis service...${NC}"
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true

# 3. Find or create the Redis config directory
echo -e "\n${YELLOW}Setting up Redis configuration...${NC}"
sudo mkdir -p /etc/redis

# 4. Check if there's an existing Redis config
EXISTING_CONFIG=""
for conf in "/etc/redis/redis.conf" "/etc/redis.conf" "/usr/share/doc/redis-server/examples/redis.conf"; do
    if [ -f "$conf" ]; then
        EXISTING_CONFIG="$conf"
        echo "Found existing config at: $conf"
        break
    fi
done

# 5. Create or update Redis configuration
REDIS_CONF="/etc/redis/redis.conf"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

if [ -n "$EXISTING_CONFIG" ] && [ "$EXISTING_CONFIG" != "$REDIS_CONF" ]; then
    echo "Copying existing config to standard location..."
    sudo cp "$EXISTING_CONFIG" "$REDIS_CONF"
fi

# 6. Create a complete Redis configuration
echo -e "\n${YELLOW}Creating Redis configuration at $REDIS_CONF...${NC}"
sudo tee "$REDIS_CONF" > /dev/null << EOF
# Redis Configuration for Vanguard Anti-Counterfeiting System
# Generated on $(date)

# Network and basic settings
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General settings
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# Snapshotting (persistence)
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
repl-diskless-sync no
repl-diskless-sync-delay 5

# Security
requirepass $REDIS_PASSWORD
# Uncomment to require password for admin commands
# rename-command CONFIG ""

# Limits
maxclients 10000

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Lazy freeing
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no

# Append only mode
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Lua scripting
lua-time-limit 5000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency monitor
latency-monitor-threshold 0

# Event notification
notify-keyspace-events ""

# Advanced config
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

# Frequency settings
hz 10
dynamic-hz yes

# AOF rewrite
aof-rewrite-incremental-fsync yes

# RDB saves
rdb-save-incremental-fsync yes
EOF

# 7. Create necessary directories with correct permissions
echo -e "\n${YELLOW}Creating Redis directories...${NC}"
sudo mkdir -p /var/lib/redis /var/log/redis /var/run/redis
sudo chown -R redis:redis /var/lib/redis /var/log/redis /var/run/redis
sudo chmod 755 /var/lib/redis /var/log/redis /var/run/redis

# 8. Create systemd service file if it doesn't exist
echo -e "\n${YELLOW}Checking systemd service...${NC}"
if [ ! -f "/lib/systemd/system/redis-server.service" ] && [ ! -f "/etc/systemd/system/redis-server.service" ]; then
    echo "Creating systemd service file..."
    sudo tee /etc/systemd/system/redis-server.service > /dev/null << 'EOF'
[Unit]
Description=Advanced key-value store
After=network.target
Documentation=http://redis.io/documentation, man:redis-server(1)

[Service]
Type=forking
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/bin/kill -s TERM $MAINPID
PIDFile=/var/run/redis/redis-server.pid
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
ReadOnlyDirectories=/
ReadWriteDirectories=-/var/lib/redis
ReadWriteDirectories=-/var/log/redis
ReadWriteDirectories=-/var/run/redis

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

# 9. Reload systemd and start Redis
echo -e "\n${YELLOW}Starting Redis service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 10. Wait for Redis to start
echo -e "\n${YELLOW}Waiting for Redis to start...${NC}"
sleep 3

# 11. Check Redis status
echo -e "\n${YELLOW}Checking Redis status...${NC}"
if sudo systemctl is-active --quiet redis-server; then
    echo -e "${GREEN}✓ Redis service is running${NC}"
else
    echo -e "${RED}✗ Redis service failed to start${NC}"
    echo "Checking logs..."
    sudo journalctl -u redis-server -n 50 --no-pager
fi

# 12. Test Redis connection
echo -e "\n${YELLOW}Testing Redis connection...${NC}"
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis is responding correctly!${NC}"
else
    echo -e "${RED}✗ Redis connection test failed${NC}"
    echo "Trying without password..."
    redis-cli ping
fi

# 13. Display summary
echo -e "\n${GREEN}=== Redis Setup Complete ===${NC}"
echo -e "Configuration file: ${BLUE}$REDIS_CONF${NC}"
echo -e "Redis password: ${BLUE}$REDIS_PASSWORD${NC}"
echo -e "Service name: ${BLUE}redis-server${NC}"
echo -e "\n${YELLOW}Important: Save the Redis password above!${NC}"
echo -e "\nTo check Redis status: ${BLUE}sudo systemctl status redis-server${NC}"
echo -e "To view Redis logs: ${BLUE}sudo journalctl -u redis-server -f${NC}"
echo -e "To connect to Redis: ${BLUE}redis-cli -a $REDIS_PASSWORD${NC}"

# 14. Create a file with the Redis password
echo "$REDIS_PASSWORD" > ~/redis-password.txt
chmod 600 ~/redis-password.txt
echo -e "\n${YELLOW}Redis password saved to: ~/redis-password.txt${NC}"

echo -e "\n${GREEN}Redis setup completed successfully!${NC}"