# 🔧 Vanguard Deployment Troubleshooting Guide

This guide helps resolve common issues during deployment of the Vanguard Anti-Counterfeiting System.

## 📋 Table of Contents

1. [Redis Configuration Issues](#redis-configuration-issues)
2. [PostgreSQL Connection Problems](#postgresql-connection-problems)
3. [Node.js Installation Failures](#nodejs-installation-failures)
4. [Nginx Configuration Errors](#nginx-configuration-errors)
5. [PM2 Process Management Issues](#pm2-process-management-issues)
6. [Database Migration Failures](#database-migration-failures)
7. [Permission Denied Errors](#permission-denied-errors)
8. [Port Already in Use](#port-already-in-use)
9. [SSL Certificate Issues](#ssl-certificate-issues)
10. [Memory and Performance Issues](#memory-and-performance-issues)

## 🔴 Redis Configuration Issues

### Problem: "sed: can't read /etc/redis.conf: No such file or directory"

**Solution:**
The Redis configuration file location varies by distribution. The updated deployment script now handles this automatically, but if you encounter this manually:

```bash
# Find Redis config file
find /etc -name "redis.conf" 2>/dev/null

# Common locations:
# Ubuntu/Debian: /etc/redis/redis.conf
# CentOS/RHEL: /etc/redis.conf
# Amazon Linux: /etc/redis.conf or /etc/redis/6379.conf

# If not found, create it:
sudo mkdir -p /etc/redis
sudo touch /etc/redis/redis.conf
```

### Problem: Redis fails to start with password

**Solution:**
```bash
# Check Redis logs
sudo journalctl -u redis -n 50

# Test Redis connection
redis-cli ping

# If password is set:
redis-cli -a your_password ping

# Reset Redis password manually:
sudo systemctl stop redis
sudo sed -i 's/requirepass .*/# requirepass foobared/' /etc/redis/redis.conf
sudo systemctl start redis
```

## 🐘 PostgreSQL Connection Problems

### Problem: "FATAL: password authentication failed for user vanguard"

**Solution:**
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER vanguard WITH PASSWORD 'new_password';
\q

# Update .env file with new password
nano /opt/vanguard/server/.env
# Update DB_PASSWORD and DATABASE_URL
```

### Problem: "could not connect to server: Connection refused"

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Check pg_hba.conf authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Ensure: local all all md5
# Ensure: host all all 127.0.0.1/32 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 📦 Node.js Installation Failures

### Problem: "Unable to locate package nodejs"

**Solution:**
```bash
# Manual Node.js 18 installation
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# For CentOS/RHEL:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Problem: "npm: command not found"

**Solution:**
```bash
# Reinstall Node.js with npm
sudo apt-get remove nodejs
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or install npm separately
sudo apt-get install npm
```

## 🌐 Nginx Configuration Errors

### Problem: "nginx: [emerg] unknown directive"

**Solution:**
```bash
# Test Nginx configuration
sudo nginx -t

# Common issues:
# 1. Missing sites-available directory (CentOS/RHEL)
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# 2. Include directive missing in nginx.conf
sudo nano /etc/nginx/nginx.conf
# Add in http block: include /etc/nginx/sites-enabled/*;

# 3. Syntax error in configuration
# Check the specific line mentioned in error
```

### Problem: "502 Bad Gateway"

**Solution:**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs vanguard-api

# Verify backend is listening on correct port
sudo netstat -plnt | grep 3000

# Restart backend
pm2 restart vanguard-api
```

## 🔄 PM2 Process Management Issues

### Problem: "PM2 command not found"

**Solution:**
```bash
# Install PM2 globally
sudo npm install -g pm2

# If npm is not in sudo PATH:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Problem: "Script not found" error in PM2

**Solution:**
```bash
# Check ecosystem.config.js paths
cat /opt/vanguard/ecosystem.config.js

# Ensure index.js exists
ls -la /opt/vanguard/server/index.js

# If missing, create it or check installation
cd /opt/vanguard
git pull origin main
cd server && npm install
```

## 🗄️ Database Migration Failures

### Problem: "Migration failed: relation already exists"

**Solution:**
```bash
# Check migration status
cd /opt/vanguard/server
npx knex migrate:status

# Reset migrations (CAUTION: This will delete all data)
npx knex migrate:rollback --all
npx knex migrate:latest

# For production, create backup first:
pg_dump -U vanguard vanguard_production > backup.sql
```

### Problem: "Cannot find module 'knex'"

**Solution:**
```bash
cd /opt/vanguard/server
npm install knex pg
npm install -g knex

# Run migrations
npx knex migrate:latest
```

## 🔐 Permission Denied Errors

### Problem: "EACCES: permission denied"

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/lib/node_modules

# Fix application directory permissions
sudo chown -R $USER:$USER /opt/vanguard
chmod -R 755 /opt/vanguard

# Fix log directory permissions
sudo chown -R $USER:$USER /var/log/vanguard
```

## 🔌 Port Already in Use

### Problem: "Error: listen EADDRINUSE: address already in use :::3000"

**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000
# or
sudo netstat -plnt | grep 3000

# Kill the process
sudo kill -9 <PID>

# Or change the port in .env
nano /opt/vanguard/server/.env
# Change PORT=3000 to PORT=3001

# Update Nginx upstream
sudo nano /etc/nginx/sites-available/vanguard
# Change server localhost:3000 to localhost:3001
```

## 🔒 SSL Certificate Issues

### Problem: "Challenge failed for domain"

**Solution:**
```bash
# Ensure domain points to server
dig yourdomain.com

# Ensure port 80 is accessible
sudo ufw allow 80
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT

# Test without SSL first
sudo certbot certonly --standalone -d yourdomain.com --dry-run

# If successful, run actual command
sudo certbot certonly --standalone -d yourdomain.com
```

## 💾 Memory and Performance Issues

### Problem: "JavaScript heap out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Or in ecosystem.config.js:
node_args: "--max-old-space-size=2048"

# Check system memory
free -h

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🆘 General Debugging Steps

1. **Check all service statuses:**
```bash
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status nginx
pm2 status
```

2. **Check all logs:**
```bash
# System logs
sudo journalctl -xe

# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/*.log
```

3. **Verify environment variables:**
```bash
cd /opt/vanguard/server
cat .env
# Ensure all required variables are set
```

4. **Test database connection:**
```bash
cd /opt/vanguard/server
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(console.log).catch(console.error).finally(() => pool.end());
"
```

5. **Reinstall dependencies:**
```bash
cd /opt/vanguard/server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/Reshigan/vanguard-complete-system/issues)
2. Review deployment logs: `cat ~/vanguard-install.log`
3. Create a new issue with:
   - OS version: `cat /etc/os-release`
   - Node version: `node --version`
   - Error messages and logs
   - Steps to reproduce

## 🔄 Clean Reinstall

If all else fails, perform a clean reinstall:

```bash
# Backup data
pg_dump -U vanguard vanguard_production > ~/vanguard-backup.sql

# Remove existing installation
pm2 delete all
sudo rm -rf /opt/vanguard
sudo -u postgres dropdb vanguard_production
sudo -u postgres dropuser vanguard

# Run deployment script again
./deploy-complete.sh
```

Remember to save your credentials from `~/vanguard-credentials.txt` before reinstalling!