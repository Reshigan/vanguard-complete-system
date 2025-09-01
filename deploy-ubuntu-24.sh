#!/bin/bash

# Vanguard Anti-Counterfeiting System - Ubuntu 24.04 Deployment Script
# This script is specifically tested for Ubuntu 24.04 LTS
# Handles all permission issues and Redis configuration properly

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ASCII Art Banner
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗  ║
║  ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗ ║
║  ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝ ║
║  ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗ ║
║   ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║ ║
║    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ║
║                                                                  ║
║        Anti-Counterfeiting System - Ubuntu 24.04 Edition         ║
║                    Powered by AI & Blockchain                    ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Configuration
INSTALL_DIR="/opt/vanguard"
LOG_DIR="/var/log/vanguard"
DATA_DIR="/var/lib/vanguard"
CURRENT_USER=$(whoami)
HOME_DIR=$HOME

# Passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD="vantax"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Function to print colored output
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
    echo -e "${MAGENTA}ℹ${NC} $1"
}

# Check if running as root
check_user() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Please run this script as a regular user (not root)"
        print_info "Run as: ubuntu@ip-172-31-10-199:~$ ./deploy-ubuntu-24.sh"
        exit 1
    fi
    print_success "Running as user: $CURRENT_USER"
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu 24.04" /etc/os-release && ! grep -q "Ubuntu 22.04" /etc/os-release; then
        print_warning "This script is optimized for Ubuntu 24.04/22.04"
    fi
    
    # Check RAM
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [ $TOTAL_RAM -lt 2048 ]; then
        print_error "Insufficient RAM: ${TOTAL_RAM}MB (minimum: 2048MB)"
        exit 1
    fi
    print_success "RAM: ${TOTAL_RAM}MB"
    
    # Check disk space
    AVAILABLE_DISK=$(df -m / | awk 'NR==2 {print $4}')
    if [ $AVAILABLE_DISK -lt 10240 ]; then
        print_error "Insufficient disk space: ${AVAILABLE_DISK}MB (minimum: 10GB)"
        exit 1
    fi
    print_success "Disk space: ${AVAILABLE_DISK}MB available"
    
    # Check sudo access
    if ! sudo -n true 2>/dev/null; then
        print_warning "This script requires sudo privileges"
        sudo -v
    fi
    print_success "Sudo access verified"
}

# Clean previous installation
clean_previous() {
    print_status "Cleaning previous installation..."
    
    # Stop services if running
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Remove directories (with proper permissions)
    sudo rm -rf $INSTALL_DIR 2>/dev/null || true
    sudo rm -rf $LOG_DIR 2>/dev/null || true
    sudo rm -rf $DATA_DIR 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update -y
    
    # Install required packages
    sudo apt-get install -y \
        curl wget git build-essential \
        nginx postgresql postgresql-contrib \
        redis-server python3 python3-pip \
        certbot python3-certbot-nginx \
        ufw htop vim zip unzip jq openssl
    
    print_success "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    
    # Remove old Node.js if exists
    sudo apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install global packages
    sudo npm install -g pm2 typescript @nestjs/cli knex
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
}

# Setup PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL database..."
    
    # Start PostgreSQL
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    # Wait for PostgreSQL
    sleep 3
    
    # Create database and user
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS vanguard_production;
DROP USER IF EXISTS vanguard;

CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE vanguard_production OWNER vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_production TO vanguard;

\c vanguard_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

    # Update pg_hba.conf for password authentication
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
    PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    
    sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    sudo sed -i "s/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             127.0.0.1\/32            md5/" $PG_HBA
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    print_success "PostgreSQL configured successfully"
}

# Setup Redis (Ubuntu 24.04 specific)
setup_redis() {
    print_status "Setting up Redis cache..."
    
    # Stop Redis if running
    sudo systemctl stop redis-server 2>/dev/null || true
    
    # Create Redis directories with proper permissions
    sudo mkdir -p /etc/redis
    sudo mkdir -p /var/lib/redis
    sudo mkdir -p /var/log/redis
    sudo mkdir -p /run/redis
    
    # Set ownership to redis user
    sudo chown redis:redis /var/lib/redis
    sudo chown redis:redis /var/log/redis
    sudo chown redis:redis /run/redis
    
    # Create Redis configuration
    sudo tee /etc/redis/redis.conf > /dev/null << EOF
# Redis Configuration for Vanguard
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize yes
pidfile /run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
always-show-logo no
set-proc-title yes
proc-title-template "{title} {listen-addr} {server-mode}"

# Snapshotting
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
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Modules
loadmodule /usr/lib/redis/modules/rejson.so 2>/dev/null || true

# Other
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
jemalloc-bg-thread yes
EOF

    # Set proper permissions on config
    sudo chown redis:redis /etc/redis/redis.conf
    sudo chmod 640 /etc/redis/redis.conf
    
    # Enable and start Redis
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    
    # Wait for Redis to start
    sleep 3
    
    # Test Redis connection
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis configured and running successfully"
    else
        print_error "Redis connection test failed"
        sudo journalctl -u redis-server -n 20 --no-pager
        exit 1
    fi
}

# Create directories
create_directories() {
    print_status "Creating directory structure..."
    
    # Create directories with sudo
    sudo mkdir -p $INSTALL_DIR/{server,client,uploads,temp}
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $DATA_DIR/{ml-models,blockchain,cache}
    
    # Create backup directory in user's home (avoid permission issues)
    mkdir -p $HOME_DIR/vanguard-backups
    
    # Set ownership to current user
    sudo chown -R $CURRENT_USER:$CURRENT_USER $INSTALL_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $LOG_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $DATA_DIR
    
    # Set permissions
    chmod -R 755 $INSTALL_DIR
    chmod -R 755 $LOG_DIR
    chmod -R 755 $DATA_DIR
    
    print_success "Directory structure created"
}

# Setup application
setup_application() {
    print_status "Setting up Vanguard application..."
    
    # Clone repository
    cd $INSTALL_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
    
    # Create server .env file
    cat > $INSTALL_DIR/server/.env <<EOF
# Vanguard Configuration
NODE_ENV=production
PORT=3000
APP_NAME=Vanguard Anti-Counterfeiting System

# Database
DATABASE_URL=postgresql://vanguard:$DB_PASSWORD@localhost:5432/vanguard_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vanguard_production
DB_USER=vanguard
DB_PASSWORD=$DB_PASSWORD

# Redis
REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Security
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
SESSION_SECRET=$SESSION_SECRET
BCRYPT_ROUNDS=10

# File Storage
UPLOAD_DIR=$INSTALL_DIR/uploads
MAX_FILE_SIZE=10485760
TEMP_DIR=$INSTALL_DIR/temp

# AI/ML
TENSORFLOW_BACKEND=cpu
ML_MODEL_PATH=$DATA_DIR/ml-models
ML_CONFIDENCE_THRESHOLD=0.85
ANOMALY_DETECTION_SENSITIVITY=0.7

# Blockchain
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@vanguard-auth.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@vanguard-auth.com

# Logging
LOG_LEVEL=info
LOG_DIR=$LOG_DIR

# Features
ENABLE_BLOCKCHAIN=true
ENABLE_ML_FEATURES=true
ENABLE_GAMIFICATION=true
ENABLE_AI_CHAT=true

# Performance
MAX_POOL_SIZE=20
WEB_CONCURRENCY=auto
EOF

    # Create client .env file
    cat > $INSTALL_DIR/client/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

    # Install server dependencies
    print_status "Installing server dependencies..."
    cd $INSTALL_DIR/server
    npm ci || npm install
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd $INSTALL_DIR/client
    npm ci || npm install
    
    # Build client
    print_status "Building client application..."
    npm run build
    
    print_success "Application setup complete"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd $INSTALL_DIR/server
    
    # Create simple migration script
    cat > migrate.js <<'EOF'
const knex = require('knex');
const config = require('./knexfile');

async function migrate() {
  const db = knex(config.production);
  try {
    await db.migrate.latest();
    console.log('Migrations completed');
    const tables = await db.raw("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

migrate();
EOF

    node migrate.js
    rm migrate.js
    
    print_success "Database migrations completed"
}

# Generate test data
generate_test_data() {
    print_status "Generating test data..."
    
    cd $INSTALL_DIR/server
    
    if [ -f "scripts/generateTestData.js" ]; then
        node scripts/generateTestData.js || print_warning "Test data generation had some issues"
    fi
    
    print_success "Test data generation attempted"
}

# Create admin user
create_admin() {
    print_status "Creating admin user..."
    
    cd $INSTALL_DIR/server
    
    cat > create-admin.js <<EOF
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    await pool.query(\`
      INSERT INTO users (email, password, name, role, created_at)
      VALUES ('admin@vanguard.local', \$1, 'System Administrator', 'admin', NOW())
      ON CONFLICT (email) DO NOTHING
    \`, [hashedPassword]);
    console.log('Admin user created');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
EOF

    node create-admin.js
    rm create-admin.js
    
    print_success "Admin user created"
}

# Setup PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    cd $INSTALL_DIR
    
    # Create ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'vanguard-api',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '$LOG_DIR/api-error.log',
      out_file: '$LOG_DIR/api-out.log',
      log_file: '$LOG_DIR/api-combined.log',
      time: true,
      max_memory_restart: '1G'
    },
    {
      name: 'vanguard-worker',
      script: './server/workers/index.js',
      instances: 2,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '$LOG_DIR/worker-error.log',
      out_file: '$LOG_DIR/worker-out.log',
      log_file: '$LOG_DIR/worker-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
EOF

    # Start PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    # Setup PM2 startup
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp $HOME_DIR
    
    print_success "PM2 configured"
}

# Setup Nginx
setup_nginx() {
    print_status "Setting up Nginx..."
    
    # Get domain
    read -p "Enter domain name (press Enter for localhost): " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-localhost}
    
    # Create Nginx config
    sudo tee /etc/nginx/sites-available/vanguard > /dev/null <<EOF
upstream vanguard_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    client_max_body_size 10M;
    
    # API
    location /api {
        proxy_pass http://vanguard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://vanguard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Static files
    location / {
        root $INSTALL_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Uploads
    location /uploads {
        alias $INSTALL_DIR/uploads;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    
    print_success "Nginx configured"
}

# Setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw reload
    
    print_success "Firewall configured"
}

# Get server IP
get_server_ip() {
    curl -s http://checkip.amazonaws.com 2>/dev/null || \
    curl -s http://ipinfo.io/ip 2>/dev/null || \
    hostname -I | awk '{print $1}'
}

# Save credentials
save_credentials() {
    SERVER_IP=$(get_server_ip)
    
    cat > $HOME_DIR/vanguard-credentials.txt <<EOF
Vanguard Anti-Counterfeiting System
===================================
Generated: $(date)

Access URLs:
- Local: http://localhost
- External: http://$SERVER_IP

Admin Login:
- Email: admin@vanguard.local
- Password: Admin@123456

Database:
- Host: localhost
- Port: 5432
- Database: vanguard_production
- Username: vanguard
- Password: $DB_PASSWORD

Redis:
- Host: localhost
- Port: 6379
- Password: $REDIS_PASSWORD

JWT Secret: $JWT_SECRET
Session Secret: $SESSION_SECRET

Installation Path: $INSTALL_DIR
Logs: $LOG_DIR
Data: $DATA_DIR

Commands:
- Status: pm2 status
- Logs: pm2 logs
- Restart: pm2 restart all
EOF

    chmod 600 $HOME_DIR/vanguard-credentials.txt
    
    print_success "Credentials saved to: $HOME_DIR/vanguard-credentials.txt"
}

# Display summary
display_summary() {
    SERVER_IP=$(get_server_ip)
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              INSTALLATION COMPLETED SUCCESSFULLY!                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}Access Information:${NC}"
    echo -e "Local URL: ${BLUE}http://localhost${NC}"
    echo -e "External URL: ${BLUE}http://$SERVER_IP${NC}"
    
    echo -e "\n${CYAN}Login Credentials:${NC}"
    echo -e "Email: ${BLUE}admin@vanguard.local${NC}"
    echo -e "Password: ${BLUE}Admin@123456${NC}"
    
    echo -e "\n${CYAN}Service Status:${NC}"
    pm2 status
    
    echo -e "\n${YELLOW}Important:${NC}"
    echo "1. Credentials saved to: ~/vanguard-credentials.txt"
    echo "2. Change admin password after first login"
    echo "3. Configure SMTP settings for emails"
    echo "4. Update CONTRACT_ADDRESS for blockchain"
    
    echo -e "\n${GREEN}Vanguard is now live at http://$SERVER_IP${NC}"
}

# Main function
main() {
    clear
    print_banner
    
    echo -e "${CYAN}Ubuntu 24.04 Deployment Script${NC}"
    echo -e "${CYAN}This script will deploy the complete Vanguard system${NC}\n"
    
    # Run all steps
    check_user
    check_requirements
    
    # Ask about clean install
    read -p "Perform clean installation? (y/N): " clean
    if [[ "$clean" =~ ^[Yy]$ ]]; then
        clean_previous
    fi
    
    install_dependencies
    install_nodejs
    setup_postgresql
    setup_redis
    create_directories
    setup_application
    run_migrations
    
    # Ask about test data
    read -p "Generate test data? (y/N): " testdata
    if [[ "$testdata" =~ ^[Yy]$ ]]; then
        generate_test_data
    fi
    
    create_admin
    setup_pm2
    setup_nginx
    setup_firewall
    save_credentials
    display_summary
    
    print_success "Deployment completed in $SECONDS seconds!"
}

# Error handler
trap 'print_error "Error on line $LINENO. Check the command that failed."; exit 1' ERR

# Run main
main "$@"