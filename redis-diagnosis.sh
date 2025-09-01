#!/bin/bash

# Redis Diagnosis Script for Ubuntu 24.04
# Run this to see exactly what's wrong with Redis

echo "=== REDIS DIAGNOSIS REPORT ==="
echo "Generated: $(date)"
echo "System: $(lsb_release -d 2>/dev/null || echo 'Unknown')"
echo

echo "1. REDIS SERVICE STATUS:"
echo "========================"
sudo systemctl status redis-server --no-pager || echo "Redis service not found or failed"
echo

echo "2. REDIS LOGS (Last 20 lines):"
echo "==============================="
sudo journalctl -u redis-server -n 20 --no-pager || echo "No Redis logs found"
echo

echo "3. REDIS USER CHECK:"
echo "===================="
if id redis >/dev/null 2>&1; then
    echo "✓ Redis user exists:"
    id redis
else
    echo "✗ Redis user does not exist"
fi
echo

echo "4. REDIS DIRECTORIES:"
echo "===================="
echo "Checking /var/lib/redis:"
ls -la /var/lib/redis 2>/dev/null || echo "Directory does not exist"
echo
echo "Checking /var/log/redis:"
ls -la /var/log/redis 2>/dev/null || echo "Directory does not exist"
echo
echo "Checking /run/redis:"
ls -la /run/redis 2>/dev/null || echo "Directory does not exist"
echo

echo "5. REDIS CONFIGURATION:"
echo "======================="
if [ -f /etc/redis/redis.conf ]; then
    echo "✓ Redis config exists at /etc/redis/redis.conf"
    echo "Config file permissions:"
    ls -la /etc/redis/redis.conf
    echo
    echo "Testing Redis configuration:"
    sudo redis-server /etc/redis/redis.conf --test-config || echo "Config test failed"
else
    echo "✗ Redis config not found at /etc/redis/redis.conf"
    echo "Looking for other Redis configs:"
    find /etc -name "*redis*" 2>/dev/null || echo "No Redis configs found"
fi
echo

echo "6. REDIS PROCESS CHECK:"
echo "======================="
ps aux | grep redis | grep -v grep || echo "No Redis processes running"
echo

echo "7. REDIS PORT CHECK:"
echo "==================="
sudo netstat -tlnp | grep 6379 || echo "Redis not listening on port 6379"
echo

echo "8. REDIS INSTALLATION CHECK:"
echo "============================"
which redis-server || echo "redis-server not found in PATH"
which redis-cli || echo "redis-cli not found in PATH"
redis-server --version 2>/dev/null || echo "Cannot get Redis version"
echo

echo "9. SYSTEMD SERVICE FILE:"
echo "======================="
if [ -f /lib/systemd/system/redis-server.service ]; then
    echo "✓ Redis systemd service exists"
    echo "Service file location: /lib/systemd/system/redis-server.service"
elif [ -f /etc/systemd/system/redis-server.service ]; then
    echo "✓ Redis systemd service exists"
    echo "Service file location: /etc/systemd/system/redis-server.service"
else
    echo "✗ Redis systemd service file not found"
    echo "Looking for Redis service files:"
    find /lib/systemd/system /etc/systemd/system -name "*redis*" 2>/dev/null || echo "No Redis service files found"
fi
echo

echo "10. DISK SPACE CHECK:"
echo "===================="
df -h /var/lib /var/log /run || echo "Cannot check disk space"
echo

echo "11. MEMORY CHECK:"
echo "================"
free -h
echo

echo "=== END OF DIAGNOSIS ==="
echo
echo "NEXT STEPS:"
echo "1. If Redis user doesn't exist: sudo useradd --system --home /var/lib/redis --shell /bin/false redis"
echo "2. If directories don't exist: sudo mkdir -p /var/lib/redis /var/log/redis /run/redis"
echo "3. If config doesn't exist: Create a new Redis configuration"
echo "4. If service file is missing: Create a new systemd service file"
echo
echo "Run the fix script to automatically resolve these issues:"
echo "wget https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/fix-redis-ubuntu24.sh"
echo "chmod +x fix-redis-ubuntu24.sh"
echo "./fix-redis-ubuntu24.sh"