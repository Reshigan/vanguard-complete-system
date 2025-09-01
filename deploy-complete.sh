#!/bin/bash

# Vanguard Anti-Counterfeiting System - Complete Deployment Script
# This script installs all dependencies and deploys the entire system with test data
# Supports: Ubuntu 20.04/22.04, Amazon Linux 2, CentOS 7/8, Debian 10/11

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
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Configuration with defaults
INSTALL_DIR="${INSTALL_DIR:-/opt/vanguard}"
LOG_DIR="${LOG_DIR:-/var/log/vanguard}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vanguard}"
DATA_DIR="${DATA_DIR:-/var/lib/vanguard}"

# Auto-generated secure passwords
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
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
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root!"
        print_info "Please run as a regular user with sudo privileges"
        exit 1
    fi
    
    # Check sudo access
    if ! sudo -n true 2>/dev/null; then
        print_warning "This script requires sudo privileges"
        sudo -v
    fi
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    case $OS in
        ubuntu|debian)
            sudo apt-get update -y
            sudo apt-get install -y \
                curl wget git build-essential \
                nginx postgresql postgresql-contrib \
                redis-server python3 python3-pip \
                certbot python3-certbot-nginx \
                ufw fail2ban htop vim \
                software-properties-common \
                gnupg lsb-release ca-certificates \
                zip unzip jq
            ;;
            
        centos|rhel|amzn)
            sudo yum update -y
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y \
                curl wget git nginx \
                postgresql14-server postgresql14 \
                redis python3 python3-pip \
                certbot python3-certbot-nginx \
                firewalld fail2ban htop vim \
                epel-release zip unzip jq
                
            # Initialize PostgreSQL on CentOS/RHEL
            if [ "$OS" != "amzn" ]; then
                sudo postgresql-setup --initdb
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
    sudo apt-get remove -y nodejs npm 2>/dev/null || true
    sudo yum remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - 2>/dev/null || \
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    
    sudo apt-get install -y nodejs 2>/dev/null || sudo yum install -y nodejs
    
    # Install global npm packages
    print_status "Installing global npm packages..."
    sudo npm install -g pm2 typescript @nestjs/cli knex
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
}

# Function to setup PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL database..."
    
    # Start and enable PostgreSQL
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    # Create database and user
    sudo -u postgres psql <<EOF
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
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
        PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    else
        PG_CONFIG="/var/lib/pgsql/data/postgresql.conf"
        PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
    fi
    
    # Update authentication method
    sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    sudo sed -i "s/local   all             all                                     ident/local   all             all                                     md5/" $PG_HBA
    sudo sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" $PG_HBA
    
    # Optimize PostgreSQL settings
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONFIG
    sudo sed -i "s/shared_buffers = .*/shared_buffers = 256MB/" $PG_CONFIG
    sudo sed -i "s/#effective_cache_size = .*/effective_cache_size = 1GB/" $PG_CONFIG
    sudo sed -i "s/#work_mem = .*/work_mem = 16MB/" $PG_CONFIG
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    print_success "PostgreSQL configured successfully"
}

# Function to setup Redis
setup_redis() {
    print_status "Setting up Redis cache..."
    
    # Find Redis configuration file
    REDIS_CONF=""
    if [ -f "/etc/redis/redis.conf" ]; then
        REDIS_CONF="/etc/redis/redis.conf"
    elif [ -f "/etc/redis.conf" ]; then
        REDIS_CONF="/etc/redis.conf"
    elif [ -f "/etc/redis/6379.conf" ]; then
        REDIS_CONF="/etc/redis/6379.conf"
    elif [ -f "/usr/local/etc/redis.conf" ]; then
        REDIS_CONF="/usr/local/etc/redis.conf"
    else
        print_error "Redis configuration file not found!"
        print_info "Searching for redis.conf..."
        REDIS_CONF=$(sudo find /etc -name "redis.conf" 2>/dev/null | head -1)
        if [ -z "$REDIS_CONF" ]; then
            print_error "Cannot locate redis.conf. Creating default configuration..."
            REDIS_CONF="/etc/redis/redis.conf"
            sudo mkdir -p /etc/redis
            sudo cp /etc/redis.conf.default $REDIS_CONF 2>/dev/null || \
            sudo cp /usr/share/doc/redis*/redis.conf $REDIS_CONF 2>/dev/null || \
            sudo touch $REDIS_CONF
        fi
    fi
    
    print_info "Using Redis config: $REDIS_CONF"
    
    # Configure Redis password
    if [ -f "$REDIS_CONF" ]; then
        # Backup original config
        sudo cp $REDIS_CONF ${REDIS_CONF}.backup
        
        # Set password
        if grep -q "^requirepass" $REDIS_CONF; then
            sudo sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" $REDIS_CONF
        elif grep -q "# requirepass foobared" $REDIS_CONF; then
            sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" $REDIS_CONF
        else
            echo "requirepass $REDIS_PASSWORD" | sudo tee -a $REDIS_CONF
        fi
        
        # Set memory limit
        if grep -q "^maxmemory" $REDIS_CONF; then
            sudo sed -i "s/^maxmemory .*/maxmemory 512mb/" $REDIS_CONF
        else
            echo "maxmemory 512mb" | sudo tee -a $REDIS_CONF
        fi
        
        # Set eviction policy
        if grep -q "^maxmemory-policy" $REDIS_CONF; then
            sudo sed -i "s/^maxmemory-policy .*/maxmemory-policy allkeys-lru/" $REDIS_CONF
        else
            echo "maxmemory-policy allkeys-lru" | sudo tee -a $REDIS_CONF
        fi
        
        # Enable persistence
        if ! grep -q "^save 900 1" $REDIS_CONF; then
            echo -e "\n# Persistence settings" | sudo tee -a $REDIS_CONF
            echo "save 900 1" | sudo tee -a $REDIS_CONF
            echo "save 300 10" | sudo tee -a $REDIS_CONF
            echo "save 60 10000" | sudo tee -a $REDIS_CONF
        fi
    else
        print_warning "Redis config file not found, creating minimal config..."
        sudo mkdir -p $(dirname $REDIS_CONF)
        cat << EOF | sudo tee $REDIS_CONF
# Redis Configuration
bind 127.0.0.1
port 6379
requirepass $REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
dir /var/lib/redis
logfile /var/log/redis/redis.log
EOF
    fi
    
    # Create Redis directories
    sudo mkdir -p /var/lib/redis /var/log/redis
    sudo chown redis:redis /var/lib/redis /var/log/redis 2>/dev/null || true
    
    # Start and enable Redis
    # Try different service names
    if systemctl list-unit-files | grep -q "^redis.service"; then
        sudo systemctl enable redis
        sudo systemctl restart redis
    elif systemctl list-unit-files | grep -q "^redis-server.service"; then
        sudo systemctl enable redis-server
        sudo systemctl restart redis-server
    elif systemctl list-unit-files | grep -q "^redis6.service"; then
        sudo systemctl enable redis6
        sudo systemctl restart redis6
    else
        print_warning "Redis service not found in systemd, trying to start manually..."
        sudo redis-server $REDIS_CONF --daemonize yes
    fi
    
    # Verify Redis is running
    sleep 2
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis configured and running successfully"
    else
        print_warning "Redis may not be running properly. Please check manually."
    fi
}

# Function to create directory structure
create_directories() {
    print_status "Creating directory structure..."
    
    # Create all necessary directories
    sudo mkdir -p $INSTALL_DIR/{server,client,uploads,temp,backups}
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p $DATA_DIR/{ml-models,blockchain,cache}
    
    # Set ownership
    sudo chown -R $USER:$USER $INSTALL_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    sudo chown -R $USER:$USER $DATA_DIR
    
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
    if [ -d ".git" ]; then
        print_info "Repository already exists, pulling latest changes..."
        git pull origin main
    else
        git clone https://github.com/Reshigan/vanguard-complete-system.git .
    fi
    
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

    # Install server dependencies
    print_status "Installing server dependencies..."
    cd $INSTALL_DIR/server
    npm ci
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd $INSTALL_DIR/client
    npm ci
    
    # Build client application
    print_status "Building client application..."
    npm run build
    
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
    node run-migrations.js
    rm run-migrations.js
    
    print_success "Database migrations completed"
}

# Function to generate test data
generate_test_data() {
    if [ "$GENERATE_TEST_DATA" = "true" ]; then
        print_status "Generating comprehensive test data..."
        
        cd $INSTALL_DIR/server
        
        # Check if data generation script exists
        if [ -f "scripts/generateTestData.js" ]; then
            node scripts/generateTestData.js
        else
            # Create inline data generation script
            cat > generate-data.js <<'EOF'
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function generateData() {
  console.log('Generating test data...');
  
  try {
    // Create test users
    const users = [];
    for (let i = 1; i <= 50; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await pool.query(`
        INSERT INTO users (email, password, name, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [
        `user${i}@example.com`,
        hashedPassword,
        `Test User ${i}`,
        i <= 5 ? 'admin' : 'consumer'
      ]);
      users.push(user.rows[0].id);
    }
    console.log(`Created ${users.length} users`);
    
    // Create manufacturers
    const manufacturers = [];
    for (let i = 1; i <= 10; i++) {
      const mfr = await pool.query(`
        INSERT INTO manufacturers (name, code, country, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id
      `, [
        `Manufacturer ${i}`,
        `MFR${String(i).padStart(3, '0')}`,
        ['USA', 'China', 'Germany', 'Japan', 'India'][i % 5]
      ]);
      manufacturers.push(mfr.rows[0].id);
    }
    console.log(`Created ${manufacturers.length} manufacturers`);
    
    // Create products
    const products = [];
    const categories = ['Electronics', 'Fashion', 'Pharmaceuticals', 'Cosmetics', 'Food'];
    for (let i = 1; i <= 100; i++) {
      const product = await pool.query(`
        INSERT INTO products (name, sku, category, manufacturer_id, price, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [
        `Product ${i}`,
        `SKU${String(i).padStart(5, '0')}`,
        categories[i % categories.length],
        manufacturers[i % manufacturers.length],
        Math.floor(Math.random() * 1000) + 10
      ]);
      products.push(product.rows[0].id);
    }
    console.log(`Created ${products.length} products`);
    
    // Create tokens
    const tokens = [];
    for (let i = 1; i <= 1000; i++) {
      const token = await pool.query(`
        INSERT INTO tokens (token, product_id, batch_number, manufacturing_date, expiry_date, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [
        uuidv4(),
        products[i % products.length],
        `BATCH${String(Math.floor(i/10)).padStart(4, '0')}`,
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        'active'
      ]);
      tokens.push(token.rows[0].id);
    }
    console.log(`Created ${tokens.length} tokens`);
    
    // Create validation events
    let validations = 0;
    for (let i = 0; i < 5000; i++) {
      const isCounterfeit = Math.random() < 0.05; // 5% counterfeit rate
      await pool.query(`
        INSERT INTO validation_events (
          token_id, user_id, location, ip_address, 
          is_valid, risk_score, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        tokens[Math.floor(Math.random() * tokens.length)],
        users[Math.floor(Math.random() * users.length)],
        JSON.stringify({
          lat: -90 + Math.random() * 180,
          lng: -180 + Math.random() * 360,
          city: ['New York', 'London', 'Tokyo', 'Mumbai', 'Sydney'][Math.floor(Math.random() * 5)]
        }),
        `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        !isCounterfeit,
        isCounterfeit ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3,
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      ]);
      validations++;
    }
    console.log(`Created ${validations} validation events`);
    
    // Create rewards
    const rewardTypes = ['points', 'badge', 'discount', 'gift'];
    for (let i = 0; i < 100; i++) {
      await pool.query(`
        INSERT INTO rewards (
          user_id, type, amount, description, 
          status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        users[Math.floor(Math.random() * users.length)],
        rewardTypes[i % rewardTypes.length],
        Math.floor(Math.random() * 1000) + 10,
        `Reward for validation #${i}`,
        Math.random() < 0.7 ? 'claimed' : 'pending'
      ]);
    }
    console.log('Created rewards');
    
    console.log('Test data generation completed!');
  } catch (error) {
    console.error('Error generating data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateData();
EOF
            
            # Run data generation
            node generate-data.js
            rm generate-data.js
        fi
        
        print_success "Test data generated successfully"
    fi
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
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    
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
    sudo tee /etc/nginx/sites-available/vanguard > /dev/null <<EOF
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
    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Restart Nginx
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    
    print_success "Nginx configured successfully"
}

# Function to setup SSL
setup_ssl() {
    if [ "$ENABLE_SSL" = "true" ] && [ "$DOMAIN_NAME" != "localhost" ]; then
        print_status "Setting up SSL certificate..."
        
        read -p "Enter email for SSL certificate: " SSL_EMAIL
        
        if [ -n "$SSL_EMAIL" ]; then
            sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL
            
            # Setup auto-renewal
            echo "0 0,12 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot-renew
            
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
        sudo ufw --force enable
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw reload
        print_success "UFW firewall configured"
    else
        # Firewalld for CentOS/RHEL
        sudo systemctl enable firewalld
        sudo systemctl start firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewalld configured"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    if [ "$ENABLE_MONITORING" = "true" ]; then
        print_status "Setting up monitoring..."
        
        # Install PM2 monitoring modules
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 10M
        pm2 set pm2-logrotate:retain 7
        pm2 set pm2-logrotate:compress true
        
        # Setup system monitoring with PM2
        pm2 install pm2-server-monit
        
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
        (crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_DIR/backup.sh") | crontab -
        
        print_success "Automated backups configured"
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

    node create-admin.js
    rm create-admin.js
    
    print_success "Admin user created"
}

# Function to display final information
display_summary() {
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
    
    echo -e "\n${CYAN}=== Service Management ===${NC}"
    echo -e "View status: ${BLUE}pm2 status${NC}"
    echo -e "View logs: ${BLUE}pm2 logs${NC}"
    echo -e "Restart services: ${BLUE}pm2 restart all${NC}"
    echo -e "Monitor services: ${BLUE}pm2 monit${NC}"
    
    echo -e "\n${CYAN}=== Test Users (if test data generated) ===${NC}"
    echo -e "Consumer: ${BLUE}user1@example.com${NC} / ${BLUE}password123${NC}"
    echo -e "Admin: ${BLUE}user2@example.com${NC} / ${BLUE}password123${NC}"
    
    # Save credentials
    cat > $HOME/vanguard-credentials.txt <<EOF
Vanguard Anti-Counterfeiting System
Installation Summary
Generated: $(date)

=== Access URLs ===
Web Interface: http://$DOMAIN_NAME
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

    chmod 600 $HOME/vanguard-credentials.txt
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Credentials saved to: ~/vanguard-credentials.txt               ║${NC}"
    echo -e "${GREEN}║   ${YELLOW}Please save these credentials and delete the file!${GREEN}             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${MAGENTA}Next Steps:${NC}"
    echo "1. Access the web interface at http://$DOMAIN_NAME"
    echo "2. Login with the admin credentials"
    echo "3. Change the admin password"
    echo "4. Configure email settings in $INSTALL_DIR/server/.env"
    echo "5. Set up your blockchain wallet and update CONTRACT_ADDRESS"
    
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        echo -e "\n${YELLOW}Don't forget to:${NC}"
        echo "- Point your domain DNS to this server's IP address"
        echo "- Configure SSL certificate if not done automatically"
    fi
}

# Main installation function
main() {
    # Clear screen and show banner
    clear
    print_banner
    
    echo -e "${CYAN}Welcome to Vanguard Anti-Counterfeiting System Installer${NC}"
    echo -e "${CYAN}This script will install and configure the complete system${NC}\n"
    
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
    
    # Start installation
    print_status "Starting installation in $DEPLOY_MODE mode..."
    
    # Run installation steps
    detect_os
    check_requirements
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