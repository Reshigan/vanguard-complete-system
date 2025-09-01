#!/bin/bash

echo "Checking Redis installation on Ubuntu..."

# Find Redis config
echo -e "\n1. Looking for Redis configuration files:"
sudo find /etc -name "redis*.conf" 2>/dev/null

# Check Redis service status
echo -e "\n2. Redis service status:"
sudo systemctl status redis-server --no-pager

# Check if Redis is running
echo -e "\n3. Redis process:"
ps aux | grep redis

# Test Redis connection
echo -e "\n4. Testing Redis connection:"
redis-cli ping || echo "Redis not responding"

# Show Redis config location from systemd
echo -e "\n5. Redis service configuration:"
sudo systemctl cat redis-server | grep -E "(ExecStart|redis.conf)"

# Common Ubuntu Redis config location
echo -e "\n6. Checking standard Ubuntu location:"
ls -la /etc/redis/redis.conf 2>/dev/null || echo "Not found at /etc/redis/redis.conf"
