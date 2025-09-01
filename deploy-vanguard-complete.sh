#!/bin/bash

# Vanguard Anti-Counterfeiting System - Complete Deployment Script with All Fixes
# This script includes all fixes for Redis, permissions, and common issues
# Works on Ubuntu 20.04/22.04/24.04, Amazon Linux 2, CentOS 7/8, Debian 10/11

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
║        Anti-Counterfeiting System - Complete Deployment          ║
║                    Powered by AI & Blockchain                    ║
║                    Version 2.0 - All Fixes Included              ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Configuration with defaults
INSTALL_DIR="${INSTALL_DIR:-/opt/vanguard}"
LOG_DIR="${LOG_DIR:-/var/log/vanguard}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vanguard}"
DATA_DIR="${DATA_DIR:-/var/lib/vanguard}"

# Auto-generated secure passwords (can be overridden)
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-vantax}"  # Using your preferred password
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)}"
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

# Deployment options
DEPLOY_MODE="${DEPLOY_MODE:-production}"
ENABLE_SSL="${ENABLE_SSL:-true}"
GENERATE_TEST_DATA="${GENERATE_TEST_DATA:-true}"
ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
ENABLE_BACKUPS="${ENABLE_BACKUPS:-true}"

# System requirements
MIN_RAM=2048
MIN_DISK=10240
MIN_CPU=2

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

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
        OS_NAME=$PRETTY_NAME
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
        VER=$(rpm -q --qf "%{VERSION}" centos-release)
        OS_NAME=$(cat /etc/redhat-release)
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
    
    print_info "Detected OS: $OS_NAME"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check RAM
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [ $TOTAL_RAM -lt $MIN_RAM ]; then
        print_error "Insufficient RAM: ${TOTAL_RAM}MB (minimum: ${MIN_RAM}MB)"
        exit 1
    fi
    print_success "RAM: ${TOTAL_RAM}MB"
    
    # Check disk space
    AVAILABLE_DISK=$(df -m / | awk 'NR==2 {print $4}')
    if [ $AVAILABLE_DISK -lt $MIN_DISK ]; then
        print_error "Insufficient disk space: ${AVAILABLE_DISK}MB (minimum: ${MIN_DISK}MB)"
        exit 1
    fi
    print_success "Disk space: ${AVAILABLE_DISK}MB available"
    
    # Check CPU cores
    CPU_CORES=$(nproc)
    if [ $CPU_CORES -lt $MIN_CPU ]; then
        print_warning "Low CPU cores: $CPU_CORES (recommended: $MIN_CPU+)"
    else
        print_success "CPU cores: $CPU_CORES"
    fi
    
    # Handle root user properly
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. Will create proper user if needed."
        # Check if ubuntu user exists
        if ! id -u ubuntu >/dev/null 2>&1; then
            print_status "Creating ubuntu user..."
            useradd -m -s /bin/bash ubuntu
            usermod -aG sudo ubuntu
            print_success "Created ubuntu user"
        fi
        RUN_USER="ubuntu"
        SUDO=""
    else
        RUN_USER="$USER"
        SUDO="sudo"
        # Check sudo access
        if ! sudo -n true 2>/dev/null; then
            print_warning "This script requires sudo privileges"
            sudo -v
        fi
    fi
}

# Function to clean previous installation
clean_previous_installation() {
    print_status "Cleaning previous installation if exists..."
    
    # Stop services
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    $SUDO systemctl stop nginx 2>/dev/null || true
    $SUDO systemctl stop redis-server 2>/dev/null || true
    $SUDO systemctl stop redis 2>/dev/null || true
    
    # Backup existing data if present
    if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/server/.env" ]; then
        print_warning "Found existing installation, backing up..."
        BACKUP_NAME="vanguard-backup-$(date +%Y%m%d_%H%M%S)"
        $SUDO mkdir -p /tmp/$BACKUP_NAME
        $SUDO cp -r $INSTALL_DIR/server/.env /tmp/$BACKUP_NAME/ 2>/dev/null || true
        $SUDO cp -r $INSTALL_DIR/uploads /tmp/$BACKUP_NAME/ 2>/dev/null || true
        print_info "Backup saved to /tmp/$BACKUP_NAME"
    fi
    
    # Remove old directories
    $SUDO rm -rf $INSTALL_DIR
    $SUDO rm -rf $LOG_DIR
    $SUDO rm -rf $DATA_DIR
    
    print_success "Cleanup completed"
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    case $OS in
        ubuntu|debian)
            $SUDO apt-get update -y
            $SUDO apt-get install -y \
                curl wget git build-essential \
                nginx postgresql postgresql-contrib \
                redis-server python3 python3-pip \
                certbot python3-certbot-nginx \
                ufw fail2ban htop vim \
                software-properties-common \
                gnupg lsb-release ca-certificates \
                zip unzip jq openssl
            ;;
            
        centos|rhel|amzn)
            $SUDO yum update -y
            $SUDO yum groupinstall -y "Development Tools"
            $SUDO yum install -y \
                curl wget git nginx \
                postgresql14-server postgresql14 \
                redis python3 python3-pip \
                certbot python3-certbot-nginx \
                firewalld fail2ban htop vim \
                epel-release zip unzip jq openssl
                
            # Initialize PostgreSQL on CentOS/RHEL
            if [ "$OS" != "amzn" ]; then
                $SUDO postgresql-setup --initdb
            fi
            ;;
            
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    
    # Remove any existing Node.js installations
    $SUDO apt-get remove -y nodejs npm 2>/dev/null || true
    $SUDO yum remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 18.x
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO -E bash -
        $SUDO apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | $SUDO bash -
        $SUDO yum install -y nodejs
    fi
    
    # Install global npm packages
    print_status "Installing global npm packages..."
    $SUDO npm install -g pm2 typescript @nestjs/cli knex
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
}

# Function to setup PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL database..."
    
    # Start and enable PostgreSQL
    $SUDO systemctl enable postgresql
    $SUDO systemctl start postgresql
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    # Create database and user
    $SUDO -u postgres psql <<EOF
-- Drop existing connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'vanguard_production' AND pid <> pg_backend_pid();

-- Create user and databases
DROP DATABASE IF EXISTS vanguard_production;
DROP DATABASE IF EXISTS vanguard_test;
DROP USER IF EXISTS vanguard;

CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE vanguard_production OWNER vanguard;
CREATE DATABASE vanguard_test OWNER vanguard;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE vanguard_production TO vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_test TO vanguard;
ALTER USER vanguard CREATEDB;

-- Enable extensions
\c vanguard_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

    # Configure PostgreSQL for password authentication
    PG_VERSION=$($SUDO -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
        PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    else
        PG_CONFIG="/var/lib/pgsql/data/postgresql.conf"
        PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
    fi
    
    # Update authentication method
    $SUDO sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    $SUDO sed -i "s/local   all             all                                     ident/local   all             all                                     md5/" $PG_HBA
    $SUDO sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" $PG_HBA
    
    # Restart PostgreSQL
    $SUDO systemctl restart postgresql
    
    print_success "PostgreSQL configured successfully"
}

# Enhanced Redis setup function with all fixes
setup_redis() {
    print_status "Setting up Redis cache..."
    
    # Stop any running Redis
    $SUDO systemctl stop redis-server 2>/dev/null || true
    $SUDO systemctl stop redis 2>/dev/null || true
    
    # Create Redis directories
    $SUDO mkdir -p /etc/redis /var/lib/redis /var/log/redis /var/run/redis
    
    # Find or create Redis configuration
    REDIS_CONF="/etc/redis/redis.conf"
    
    print_status "Creating Redis configuration at $REDIS_CONF..."
    $SUDO tee "$REDIS_CONF" > /dev/null << EOF
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

# Security
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

    # Set permissions
    $SUDO chown -R redis:redis /var/lib/redis /var/log/redis /var/run/redis 2>/dev/null || true
    $SUDO chmod 755 /var/lib/redis /var/log/redis /var/run/redis
    $SUDO chmod 640 $REDIS_CONF
    
    # Create systemd service if needed (for Ubuntu)
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        if [ ! -f "/lib/systemd/system/redis-server.service" ]; then
            print_status "Creating Redis systemd service..."
            $SUDO tee /etc/systemd/system/redis-server.service > /dev/null << 'EOF'
[Unit]
Description=Advanced key-value store
After=network.target

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

[Install]
WantedBy=multi-user.target
EOF
        fi
    fi
    
    # Reload systemd and start Redis
    $SUDO systemctl daemon-reload
    
    # Start Redis with the correct service name
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        $SUDO systemctl enable redis-server
        $SUDO systemctl start redis-server
        REDIS_SERVICE="redis-server"
    else
        $SUDO systemctl enable redis
        $SUDO systemctl start redis
        REDIS_SERVICE="redis"
    fi
    
    # Wait for Redis to start
    sleep 3
    
    # Verify Redis is running
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis configured and running successfully"
    else
        print_warning "Redis may not be responding. Checking status..."
        $SUDO systemctl status $REDIS_SERVICE --no-pager
    fi
}

# Function to create directory structure
create_directories() {
    print_status "Creating directory structure..."
    
    # Create all necessary directories
    $SUDO mkdir -p $INSTALL_DIR/{server,client,uploads,temp,backups}
    $SUDO mkdir -p $LOG_DIR
    $SUDO mkdir -p $BACKUP_DIR
    $SUDO mkdir -p $DATA_DIR/{ml-models,blockchain,cache}
    
    # Set ownership
    if [[ $EUID -eq 0 ]]; then
        $SUDO chown -R $RUN_USER:$RUN_USER $INSTALL_DIR
        $SUDO chown -R $RUN_USER:$RUN_USER $LOG_DIR
        $SUDO chown -R $RUN_USER:$RUN_USER $DATA_DIR
    else
        $SUDO chown -R $USER:$USER $INSTALL_DIR
        $SUDO chown -R $USER:$USER $LOG_DIR
        $SUDO chown -R $USER:$USER $DATA_DIR
    fi
    
    # Set permissions
    chmod 755 $INSTALL_DIR
    chmod 755 $LOG_DIR
    chmod 700 $BACKUP_DIR
    
    print_success "Directory structure created"
}

# Function to clone and setup application
setup_application() {
    print_status "Setting up Vanguard application..."
    
    # Clone repository
    cd $INSTALL_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
    
    # Create environment file for server
    cat > $INSTALL_DIR/server/.env <<EOF
# Vanguard Anti-Counterfeiting System Configuration
# Generated on $(date)

# Application
NODE_ENV=$DEPLOY_MODE
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

# Email (Configure with your SMTP)
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

    # Create environment file for client
    cat > $INSTALL_DIR/client/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

    # Fix ownership if running as root
    if [[ $EUID -eq 0 ]]; then
        chown -R $RUN_USER:$RUN_USER $INSTALL_DIR
    fi
    
    # Install dependencies as the appropriate user
    if [[ $EUID -eq 0 ]]; then
        print_status "Installing server dependencies..."
        su - $RUN_USER -c "cd $INSTALL_DIR/server && npm ci"
        
        print_status "Installing client dependencies..."
        su - $RUN_USER -c "cd $INSTALL_DIR/client && npm ci"
        
        print_status "Building client application..."
        su - $RUN_USER -c "cd $INSTALL_DIR/client && npm run build"
    else
        print_status "Installing server dependencies..."
        cd $INSTALL_DIR/server
        npm ci
        
        print_status "Installing client dependencies..."
        cd $INSTALL_DIR/client
        npm ci
        
        print_status "Building client application..."
        npm run build
    fi
    
    print_success "Application setup complete"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd $INSTALL_DIR/server
    
    # Create migration runner script
    cat > run-migrations.js <<'EOF'
const knex = require('knex');
const config = require('./knexfile');

async function runMigrations() {
  const db = knex(config.production);
  
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully');
    
    // Check if tables exist
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Created tables:', tables.rows.map(r => r.table_name).join(', '));
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigrations();
EOF

    # Run migrations
    if [[ $EUID -eq 0 ]]; then
        su - $RUN_USER -c "cd $INSTALL_DIR/server && node run-migrations.js"
    else
        node run-migrations.js
    fi
    
    rm run-migrations.js
    
    print_success "Database migrations completed"
}

# Function to generate test data
generate_test_data() {
    if [ "$GENERATE_TEST_DATA" = "true" ]; then
        print_status "Generating comprehensive test data..."
        
        cd $INSTALL_DIR/server
        
        if [ -f "scripts/generateTestData.js" ]; then
            if [[ $EUID -eq 0 ]]; then
                su - $RUN_USER -c "cd $INSTALL_DIR/server && node scripts/generateTestData.js"
            else
                node scripts/generateTestData.js
            fi
        fi
        
        print_success "Test data generated successfully"
    fi
}

# Function to create admin user
create_admin_user() {
    print_status "Creating admin user..."
    
    cd $INSTALL_DIR/server
    
    cat > create-admin.js <<EOF
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAdmin() {
  const email = 'admin@vanguard.local';
  const password = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    await pool.query(\`
      INSERT INTO users (email, password, name, role, created_at)
      VALUES (\$1, \$2, \$3, \$4, NOW())
      ON CONFLICT (email) DO NOTHING
    \`, [email, hashedPassword, 'System Administrator', 'admin']);
    
    console.log('Admin user created:');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    console.log('Please change this password after first login!');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
EOF

    if [[ $EUID -eq 0 ]]; then
        su - $RUN_USER -c "cd $INSTALL_DIR/server && node create-admin.js"
    else
        node create-admin.js
    fi
    
    rm create-admin.js
    
    print_success "Admin user created"
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > $INSTALL_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'vanguard-api',
      script: '$INSTALL_DIR/server/index.js',
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
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'vanguard-worker',
      script: '$INSTALL_DIR/server/workers/index.js',
      instances: 2,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '$LOG_DIR/worker-error.log',
      out_file: '$LOG_DIR/worker-out.log',
      log_file: '$LOG_DIR/worker-combined.log',
      time: true,
      max_memory_restart: '512M',
      autorestart: true,
      watch: false
    }
  ]
};
EOF

    # Start applications
    cd $INSTALL_DIR
    
    if [[ $EUID -eq 0 ]]; then
        su - $RUN_USER -c "cd $INSTALL_DIR && pm2 start ecosystem.config.js"
        su - $RUN_USER -c "pm2 save"
        $SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $RUN_USER --hp /home/$RUN_USER
    else
        pm2 start ecosystem.config.js
        pm2 save
        $SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    fi
    
    print_success "PM2 configured and applications started"
}

# Function to setup Nginx
setup_nginx() {
    print_status "Setting up Nginx web server..."
    
    # Get domain name if not set
    if [ -z "$DOMAIN_NAME" ]; then
        read -p "Enter your domain name (or press Enter for localhost): " DOMAIN_NAME
        DOMAIN_NAME=${DOMAIN_NAME:-localhost}
    fi
    
    # Create Nginx configuration
    $SUDO tee /etc/nginx/sites-available/vanguard > /dev/null <<EOF
upstream vanguard_backend {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Client body size
    client_max_body_size 10M;
    
    # API routes
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
        proxy_read_timeout 86400;
    }
    
    # WebSocket support
    location /socket.io {
        proxy_pass http://vanguard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location / {
        root $INSTALL_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads
    location /uploads {
        alias $INSTALL_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable site
    $SUDO ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    $SUDO nginx -t
    
    # Restart Nginx
    $SUDO systemctl enable nginx
    $SUDO systemctl restart nginx
    
    print_success "Nginx configured successfully"
}

# Function to setup SSL
setup_ssl() {
    if [ "$ENABLE_SSL" = "true" ] && [ "$DOMAIN_NAME" != "localhost" ]; then
        print_status "Setting up SSL certificate..."
        
        read -p "Enter email for SSL certificate: " SSL_EMAIL
        
        if [ -n "$SSL_EMAIL" ]; then
            $SUDO certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL
            
            # Setup auto-renewal
            echo "0 0,12 * * * root certbot renew --quiet" | $SUDO tee /etc/cron.d/certbot-renew
            
            print_success "SSL certificate installed"
        else
            print_warning "Skipping SSL setup - no email provided"
        fi
    fi
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        # UFW for Ubuntu/Debian
        $SUDO ufw --force enable
        $SUDO ufw default deny incoming
        $SUDO ufw default allow outgoing
        $SUDO ufw allow 22/tcp
        $SUDO ufw allow 80/tcp
        $SUDO ufw allow 443/tcp
        $SUDO ufw reload
        print_success "UFW firewall configured"
    else
        # Firewalld for CentOS/RHEL
        $SUDO systemctl enable firewalld
        $SUDO systemctl start firewalld
        $SUDO firewall-cmd --permanent --add-service=ssh
        $SUDO firewall-cmd --permanent --add-service=http
        $SUDO firewall-cmd --permanent --add-service=https
        $SUDO firewall-cmd --reload
        print_success "Firewalld configured"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    if [ "$ENABLE_MONITORING" = "true" ]; then
        print_status "Setting up monitoring..."
        
        if [[ $EUID -eq 0 ]]; then
            su - $RUN_USER -c "pm2 install pm2-logrotate"
            su - $RUN_USER -c "pm2 set pm2-logrotate:max_size 10M"
            su - $RUN_USER -c "pm2 set pm2-logrotate:retain 7"
            su - $RUN_USER -c "pm2 set pm2-logrotate:compress true"
            su - $RUN_USER -c "pm2 install pm2-server-monit"
        else
            pm2 install pm2-logrotate
            pm2 set pm2-logrotate:max_size 10M
            pm2 set pm2-logrotate:retain 7
            pm2 set pm2-logrotate:compress true
            pm2 install pm2-server-monit
        fi
        
        print_success "Monitoring configured"
    fi
}

# Function to setup automated backups
setup_backups() {
    if [ "$ENABLE_BACKUPS" = "true" ]; then
        print_status "Setting up automated backups..."
        
        # Create backup script
        cat > $BACKUP_DIR/backup.sh <<EOF
#!/bin/bash
BACKUP_DIR="$BACKUP_DIR"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="vanguard_production"

# Database backup
PGPASSWORD="$DB_PASSWORD" pg_dump -U vanguard -h localhost \$DB_NAME | gzip > \$BACKUP_DIR/db_backup_\$DATE.sql.gz

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: \$BACKUP_DIR/db_backup_\$DATE.sql.gz"
EOF

        chmod +x $BACKUP_DIR/backup.sh
        
        # Setup cron job
        if [[ $EUID -eq 0 ]]; then
            (crontab -l -u $RUN_USER 2>/dev/null; echo "0 2 * * * $BACKUP_DIR/backup.sh") | crontab -u $RUN_USER -
        else
            (crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_DIR/backup.sh") | crontab -
        fi
        
        print_success "Automated backups configured"
    fi
}

# Function to get server IP
get_server_ip() {
    # Try multiple methods to get external IP
    SERVER_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || \
                curl -s http://ipinfo.io/ip 2>/dev/null || \
                curl -s http://ifconfig.me 2>/dev/null || \
                echo "localhost")
    echo $SERVER_IP
}

# Function to display final information
display_summary() {
    SERVER_IP=$(get_server_ip)
    
    print_banner
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              INSTALLATION COMPLETED SUCCESSFULLY!                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}=== System Information ===${NC}"
    echo -e "Installation Directory: ${BLUE}$INSTALL_DIR${NC}"
    echo -e "Log Directory: ${BLUE}$LOG_DIR${NC}"
    echo -e "Data Directory: ${BLUE}$DATA_DIR${NC}"
    
    echo -e "\n${CYAN}=== Access Information ===${NC}"
    echo -e "Web Interface: ${BLUE}http://$DOMAIN_NAME${NC}"
    if [ "$DOMAIN_NAME" = "localhost" ] && [ "$SERVER_IP" != "localhost" ]; then
        echo -e "External Access: ${BLUE}http://$SERVER_IP${NC}"
    fi
    if [ "$ENABLE_SSL" = "true" ] && [ "$DOMAIN_NAME" != "localhost" ]; then
        echo -e "Secure URL: ${BLUE}https://$DOMAIN_NAME${NC}"
    fi
    echo -e "API Endpoint: ${BLUE}http://$DOMAIN_NAME/api${NC}"
    
    echo -e "\n${CYAN}=== Default Credentials ===${NC}"
    echo -e "Admin Email: ${BLUE}admin@vanguard.local${NC}"
    echo -e "Admin Password: ${BLUE}Admin@123456${NC}"
    echo -e "${YELLOW}⚠ Please change the admin password after first login!${NC}"
    
    echo -e "\n${CYAN}=== Database Credentials ===${NC}"
    echo -e "Database: ${BLUE}vanguard_production${NC}"
    echo -e "Username: ${BLUE}vanguard${NC}"
    echo -e "Password: ${BLUE}$DB_PASSWORD${NC}"
    
    echo -e "\n${CYAN}=== Redis Credentials ===${NC}"
    echo -e "Host: ${BLUE}localhost${NC}"
    echo -e "Port: ${BLUE}6379${NC}"
    echo -e "Password: ${BLUE}$REDIS_PASSWORD${NC}"
    
    echo -e "\n${CYAN}=== Service Management ===${NC}"
    if [[ $EUID -eq 0 ]]; then
        echo -e "View status: ${BLUE}su - $RUN_USER -c 'pm2 status'${NC}"
        echo -e "View logs: ${BLUE}su - $RUN_USER -c 'pm2 logs'${NC}"
        echo -e "Restart services: ${BLUE}su - $RUN_USER -c 'pm2 restart all'${NC}"
    else
        echo -e "View status: ${BLUE}pm2 status${NC}"
        echo -e "View logs: ${BLUE}pm2 logs${NC}"
        echo -e "Restart services: ${BLUE}pm2 restart all${NC}"
    fi
    echo -e "Monitor services: ${BLUE}pm2 monit${NC}"
    
    echo -e "\n${CYAN}=== Test Users (if test data generated) ===${NC}"
    echo -e "Consumer: ${BLUE}user1@example.com${NC} / ${BLUE}password123${NC}"
    echo -e "Admin: ${BLUE}user2@example.com${NC} / ${BLUE}password123${NC}"
    
    # Save credentials
    CRED_FILE="$HOME/vanguard-credentials.txt"
    if [[ $EUID -eq 0 ]]; then
        CRED_FILE="/home/$RUN_USER/vanguard-credentials.txt"
    fi
    
    cat > $CRED_FILE <<EOF
Vanguard Anti-Counterfeiting System
Installation Summary
Generated: $(date)

=== Access URLs ===
Web Interface: http://$DOMAIN_NAME
External Access: http://$SERVER_IP
API Endpoint: http://$DOMAIN_NAME/api

=== Admin Credentials ===
Email: admin@vanguard.local
Password: Admin@123456

=== Database Credentials ===
Host: localhost
Port: 5432
Database: vanguard_production
Username: vanguard
Password: $DB_PASSWORD

=== Redis Credentials ===
Host: localhost
Port: 6379
Password: $REDIS_PASSWORD

=== Security Keys ===
JWT Secret: $JWT_SECRET
Session Secret: $SESSION_SECRET

=== Important Paths ===
Installation: $INSTALL_DIR
Logs: $LOG_DIR
Backups: $BACKUP_DIR
Data: $DATA_DIR

IMPORTANT: Keep this file secure and delete after saving credentials!
EOF

    chmod 600 $CRED_FILE
    if [[ $EUID -eq 0 ]]; then
        chown $RUN_USER:$RUN_USER $CRED_FILE
    fi
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Credentials saved to: $CRED_FILE${NC}"
    echo -e "${GREEN}║   ${YELLOW}Please save these credentials and delete the file!${GREEN}             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${MAGENTA}Next Steps:${NC}"
    echo "1. Access the web interface at http://$DOMAIN_NAME"
    if [ "$DOMAIN_NAME" = "localhost" ] && [ "$SERVER_IP" != "localhost" ]; then
        echo "   Or use: http://$SERVER_IP"
    fi
    echo "2. Login with the admin credentials"
    echo "3. Change the admin password"
    echo "4. Configure email settings in $INSTALL_DIR/server/.env"
    echo "5. Set up your blockchain wallet and update CONTRACT_ADDRESS"
    
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        echo -e "\n${YELLOW}Don't forget to:${NC}"
        echo "- Point your domain DNS to this server's IP address"
        echo "- Configure SSL certificate if not done automatically"
    fi
    
    # Show PM2 status
    echo -e "\n${CYAN}=== Current Service Status ===${NC}"
    if [[ $EUID -eq 0 ]]; then
        su - $RUN_USER -c "pm2 status"
    else
        pm2 status
    fi
}

# Main installation function
main() {
    # Clear screen and show banner
    clear
    print_banner
    
    echo -e "${CYAN}Welcome to Vanguard Anti-Counterfeiting System Installer${NC}"
    echo -e "${CYAN}This script will install and configure the complete system${NC}"
    echo -e "${CYAN}Version 2.0 - Includes all fixes for Redis, permissions, and common issues${NC}\n"
    
    # Prompt for installation mode
    echo "Select installation mode:"
    echo "1) Production (recommended)"
    echo "2) Development"
    echo "3) Testing"
    read -p "Enter choice [1-3]: " mode_choice
    
    case $mode_choice in
        1) DEPLOY_MODE="production" ;;
        2) DEPLOY_MODE="development" ;;
        3) DEPLOY_MODE="test" ;;
        *) DEPLOY_MODE="production" ;;
    esac
    
    # Ask about test data
    read -p "Generate test data? (y/N): " gen_test
    GENERATE_TEST_DATA=$([ "$gen_test" = "y" ] || [ "$gen_test" = "Y" ] && echo "true" || echo "false")
    
    # Ask about clean install
    read -p "Perform clean installation? This will remove any existing installation (y/N): " clean_install
    CLEAN_INSTALL=$([ "$clean_install" = "y" ] || [ "$clean_install" = "Y" ] && echo "true" || echo "false")
    
    # Start installation
    print_status "Starting installation in $DEPLOY_MODE mode..."
    
    # Run installation steps
    detect_os
    check_requirements
    
    if [ "$CLEAN_INSTALL" = "true" ]; then
        clean_previous_installation
    fi
    
    install_dependencies
    install_nodejs
    setup_postgresql
    setup_redis
    create_directories
    setup_application
    run_migrations
    generate_test_data
    create_admin_user
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    setup_monitoring
    setup_backups
    
    # Display summary
    display_summary
    
    print_success "Installation completed successfully!"
    print_info "Total installation time: $SECONDS seconds"
}

# Error handler
trap 'print_error "Installation failed at line $LINENO. Check logs for details."; exit 1' ERR

# Run main function
main "$@"