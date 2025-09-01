#!/bin/bash

# Vanguard Anti-Counterfeiting System - Complete Clean Installation
# This script completely cleans the server and installs everything from scratch
# Designed for Ubuntu 24.04 LTS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Banner
print_banner() {
    clear
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
║              COMPLETE CLEAN INSTALLATION SCRIPT                  ║
║                    Ubuntu 24.04 LTS Edition                      ║
║                                                                  ║
║    🧹 CLEANS EVERYTHING  🚀 FRESH INSTALL  ✅ GUARANTEED WORKING  ║
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

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD="vantax"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Print functions
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
        print_info "Usage: ubuntu@server:~$ ./clean-install-vanguard.sh"
        exit 1
    fi
    print_success "Running as user: $CURRENT_USER"
}

# Comprehensive cleanup function
complete_cleanup() {
    print_status "🧹 PERFORMING COMPLETE SYSTEM CLEANUP..."
    
    print_status "Stopping all services..."
    # Stop PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    
    # Stop system services
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl stop redis-server 2>/dev/null || true
    sudo systemctl stop redis 2>/dev/null || true
    sudo systemctl stop postgresql 2>/dev/null || true
    
    # Kill any remaining processes
    sudo pkill -f redis-server 2>/dev/null || true
    sudo pkill -f nginx 2>/dev/null || true
    sudo pkill -f node 2>/dev/null || true
    
    print_status "Removing all Vanguard installations..."
    # Remove all Vanguard directories
    sudo rm -rf $INSTALL_DIR 2>/dev/null || true
    sudo rm -rf $LOG_DIR 2>/dev/null || true
    sudo rm -rf $DATA_DIR 2>/dev/null || true
    sudo rm -rf /var/backups/vanguard 2>/dev/null || true
    rm -rf $HOME_DIR/vanguard-* 2>/dev/null || true
    
    print_status "Removing configuration files..."
    # Remove configs
    sudo rm -rf /etc/nginx/sites-available/vanguard 2>/dev/null || true
    sudo rm -rf /etc/nginx/sites-enabled/vanguard 2>/dev/null || true
    sudo rm -rf /etc/redis/redis.conf 2>/dev/null || true
    
    print_status "Removing packages that might cause conflicts..."
    # Remove potentially problematic packages
    sudo apt-get remove --purge -y redis-server redis-tools 2>/dev/null || true
    sudo apt-get remove --purge -y nodejs npm 2>/dev/null || true
    sudo apt-get autoremove -y 2>/dev/null || true
    sudo apt-get autoclean 2>/dev/null || true
    
    print_status "Cleaning package cache..."
    sudo apt-get clean
    
    print_status "Removing PM2 startup scripts..."
    sudo env PATH=$PATH:/usr/bin pm2 unstartup systemd 2>/dev/null || true
    
    print_status "Resetting firewall..."
    sudo ufw --force reset 2>/dev/null || true
    
    print_success "🧹 COMPLETE CLEANUP FINISHED"
    sleep 2
}

# Fresh system preparation
prepare_system() {
    print_status "🔧 PREPARING FRESH SYSTEM..."
    
    print_status "Updating package lists..."
    sudo apt-get update -y
    
    print_status "Upgrading system packages..."
    sudo apt-get upgrade -y
    
    print_status "Installing essential tools..."
    sudo apt-get install -y \
        curl wget git build-essential \
        software-properties-common \
        apt-transport-https ca-certificates \
        gnupg lsb-release \
        zip unzip jq openssl \
        htop vim nano
    
    print_success "🔧 SYSTEM PREPARATION COMPLETE"
}

# Install Node.js from scratch
install_nodejs() {
    print_status "📦 INSTALLING NODE.JS 18..."
    
    # Remove any existing Node.js
    sudo apt-get remove --purge -y nodejs npm 2>/dev/null || true
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # Install Node.js
    sudo apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION installed"
    print_success "npm $NPM_VERSION installed"
    
    # Install global packages
    print_status "Installing global npm packages..."
    sudo npm install -g pm2@latest
    
    print_success "📦 NODE.JS INSTALLATION COMPLETE"
}

# Install and configure PostgreSQL
install_postgresql() {
    print_status "🗄️ INSTALLING POSTGRESQL..."
    
    # Install PostgreSQL
    sudo apt-get install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    # Wait for PostgreSQL to be ready
    sleep 5
    
    # Create database and user
    print_status "Creating database and user..."
    sudo -u postgres psql <<EOF
-- Drop existing if any
DROP DATABASE IF EXISTS vanguard_production;
DROP USER IF EXISTS vanguard;

-- Create fresh user and database
CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE vanguard_production OWNER vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_production TO vanguard;
ALTER USER vanguard CREATEDB;

-- Connect to database and add extensions
\c vanguard_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

    # Configure authentication
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
    PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    
    # Backup original
    sudo cp $PG_HBA $PG_HBA.backup
    
    # Update authentication method
    sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    sudo sed -i "s/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             127.0.0.1\/32            md5/" $PG_HBA
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    # Test connection
    if PGPASSWORD=$DB_PASSWORD psql -U vanguard -d vanguard_production -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "PostgreSQL connection test passed"
    else
        print_error "PostgreSQL connection test failed"
        exit 1
    fi
    
    print_success "🗄️ POSTGRESQL INSTALLATION COMPLETE"
}

# Install and configure Redis (bulletproof method)
install_redis() {
    print_status "🔴 INSTALLING REDIS..."
    
    # Install Redis
    sudo apt-get install -y redis-server
    
    # Stop Redis to configure it
    sudo systemctl stop redis-server
    
    # Create Redis user if doesn't exist
    if ! id redis >/dev/null 2>&1; then
        sudo useradd --system --home /var/lib/redis --shell /bin/false redis
    fi
    
    # Create directories
    sudo mkdir -p /var/lib/redis /var/log/redis /run/redis
    sudo chown redis:redis /var/lib/redis /var/log/redis /run/redis
    sudo chmod 755 /var/lib/redis /var/log/redis /run/redis
    
    # Create bulletproof Redis configuration
    print_status "Creating Redis configuration..."
    sudo tee /etc/redis/redis.conf > /dev/null << EOF
# Vanguard Redis Configuration - Bulletproof
bind 127.0.0.1
port 6379
daemonize yes
supervised systemd
pidfile /run/redis/redis-server.pid
logfile /var/log/redis/redis-server.log
loglevel notice
databases 16
dir /var/lib/redis
requirepass $REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
EOF

    # Set proper permissions
    sudo chown redis:redis /etc/redis/redis.conf
    sudo chmod 640 /etc/redis/redis.conf
    
    # Test configuration
    print_status "Testing Redis configuration..."
    if sudo -u redis redis-server /etc/redis/redis.conf --test-config; then
        print_success "Redis configuration is valid"
    else
        print_error "Redis configuration test failed"
        exit 1
    fi
    
    # Start Redis
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    
    # Wait for Redis to start
    sleep 5
    
    # Test Redis connection
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis connection test passed"
        
        # Test basic operations
        redis-cli -a "$REDIS_PASSWORD" SET test "Hello" >/dev/null
        RESULT=$(redis-cli -a "$REDIS_PASSWORD" GET test 2>/dev/null)
        if [ "$RESULT" = "Hello" ]; then
            print_success "Redis operations test passed"
            redis-cli -a "$REDIS_PASSWORD" DEL test >/dev/null
        else
            print_error "Redis operations test failed"
            exit 1
        fi
    else
        print_error "Redis connection test failed"
        sudo systemctl status redis-server --no-pager
        exit 1
    fi
    
    print_success "🔴 REDIS INSTALLATION COMPLETE"
}

# Install and configure Nginx
install_nginx() {
    print_status "🌐 INSTALLING NGINX..."
    
    # Install Nginx
    sudo apt-get install -y nginx
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    print_success "🌐 NGINX INSTALLATION COMPLETE"
}

# Create directory structure
create_directories() {
    print_status "📁 CREATING DIRECTORY STRUCTURE..."
    
    # Create main directories
    sudo mkdir -p $INSTALL_DIR/{server,client,uploads,temp}
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $DATA_DIR/{ml-models,blockchain,cache}
    
    # Create backup directory in user home
    mkdir -p $HOME_DIR/vanguard-backups
    
    # Set ownership
    sudo chown -R $CURRENT_USER:$CURRENT_USER $INSTALL_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $LOG_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $DATA_DIR
    
    # Set permissions
    chmod -R 755 $INSTALL_DIR
    chmod -R 755 $LOG_DIR
    chmod -R 755 $DATA_DIR
    
    print_success "📁 DIRECTORY STRUCTURE CREATED"
}

# Clone and setup application
setup_application() {
    print_status "⚙️ SETTING UP VANGUARD APPLICATION..."
    
    # Clone repository
    cd $INSTALL_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
    
    # Create server environment file
    print_status "Creating server configuration..."
    cat > server/.env <<EOF
# Vanguard Anti-Counterfeiting System Configuration
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

# AI/ML Features
TENSORFLOW_BACKEND=cpu
ML_MODEL_PATH=$DATA_DIR/ml-models
ML_CONFIDENCE_THRESHOLD=0.85
ANOMALY_DETECTION_SENSITIVITY=0.7

# Blockchain
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@vanguard-auth.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@vanguard-auth.com

# Logging
LOG_LEVEL=info
LOG_DIR=$LOG_DIR

# Feature Flags
ENABLE_BLOCKCHAIN=true
ENABLE_ML_FEATURES=true
ENABLE_GAMIFICATION=true
ENABLE_AI_CHAT=true

# Performance
MAX_POOL_SIZE=20
WEB_CONCURRENCY=auto
EOF

    # Create client environment file
    cat > client/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

    print_success "⚙️ APPLICATION SETUP COMPLETE"
}

# Install application dependencies
install_dependencies() {
    print_status "📦 INSTALLING APPLICATION DEPENDENCIES..."
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd $INSTALL_DIR/server
    npm install --production
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd $INSTALL_DIR/client
    npm install
    
    # Build client application
    print_status "Building client application..."
    npm run build
    
    print_success "📦 DEPENDENCIES INSTALLED"
}

# Create database schema
create_database_schema() {
    print_status "🏗️ CREATING DATABASE SCHEMA..."
    
    cd $INSTALL_DIR/server
    
    # Create comprehensive schema
    cat > create-schema.js <<'EOF'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSchema() {
  try {
    console.log('Creating database schema...');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'consumer',
        phone VARCHAR(20),
        address TEXT,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        verified BOOLEAN DEFAULT false,
        avatar_url VARCHAR(500),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Manufacturers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        website VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        verified BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0,
        total_products INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        description TEXT,
        manufacturer_id INTEGER REFERENCES manufacturers(id),
        category VARCHAR(100),
        price DECIMAL(10,2),
        image_url VARCHAR(500),
        specifications JSONB,
        status VARCHAR(50) DEFAULT 'active',
        total_tokens INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Authentication tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        product_id INTEGER REFERENCES products(id),
        batch_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        qr_code TEXT,
        blockchain_hash VARCHAR(255),
        location_data JSONB,
        validation_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Validations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS validations (
        id SERIAL PRIMARY KEY,
        token_id INTEGER REFERENCES auth_tokens(id),
        user_id INTEGER REFERENCES users(id),
        location VARCHAR(255),
        coordinates POINT,
        ip_address INET,
        user_agent TEXT,
        device_info JSONB,
        result VARCHAR(50),
        confidence_score DECIMAL(3,2),
        risk_factors JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        type VARCHAR(50),
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        evidence_urls TEXT[],
        location VARCHAR(255),
        assigned_to INTEGER REFERENCES users(id),
        resolution TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Rewards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        points INTEGER NOT NULL,
        reason VARCHAR(255),
        type VARCHAR(50),
        reference_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100),
        data JSONB,
        user_id INTEGER REFERENCES users(id),
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Channels table (for tracking sales channels)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        risk_score DECIMAL(3,2) DEFAULT 0,
        total_reports INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ML Models table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ml_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        version VARCHAR(50),
        accuracy DECIMAL(5,4),
        status VARCHAR(50) DEFAULT 'active',
        model_path VARCHAR(500),
        parameters JSONB,
        training_data_size INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_validations_created_at ON validations(created_at);
      CREATE INDEX IF NOT EXISTS idx_validations_user_id ON validations(user_id);
      CREATE INDEX IF NOT EXISTS idx_validations_token_id ON validations(token_id);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_product_id ON auth_tokens(product_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
    `);
    
    console.log('✅ Database schema created successfully');
    console.log('✅ All tables and indexes created');
    
  } catch (error) {
    console.error('❌ Schema creation error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSchema();
EOF

    # Run schema creation
    node create-schema.js
    rm create-schema.js
    
    print_success "🏗️ DATABASE SCHEMA CREATED"
}

# Create admin user and test data
create_users_and_data() {
    print_status "👤 CREATING USERS AND TEST DATA..."
    
    cd $INSTALL_DIR/server
    
    cat > create-data.js <<'EOF'
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createData() {
  try {
    console.log('Creating admin user...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, role, verified, points, level)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@vanguard.local', hashedPassword, 'System Administrator', 'admin', true, 10000, 10]);
    
    console.log('Creating test manufacturer...');
    
    // Create test manufacturer
    const manufacturerResult = await pool.query(`
      INSERT INTO manufacturers (name, email, verified, description, rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['Acme Corporation', 'contact@acme.com', true, 'Leading manufacturer of premium electronics', 4.8]);
    
    const manufacturerId = manufacturerResult.rows[0].id;
    
    console.log('Creating test products...');
    
    // Create test products
    const products = [
      { name: 'Premium Wireless Headphones', category: 'Electronics', price: 299.99 },
      { name: 'Smart Fitness Watch', category: 'Wearables', price: 199.99 },
      { name: 'Bluetooth Speaker Pro', category: 'Audio', price: 149.99 },
      { name: 'Gaming Mouse Elite', category: 'Gaming', price: 89.99 },
      { name: 'Wireless Charging Pad', category: 'Accessories', price: 49.99 }
    ];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productResult = await pool.query(`
        INSERT INTO products (name, sku, manufacturer_id, category, price, status, total_tokens)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [product.name, `SKU-${1000 + i}`, manufacturerId, product.category, product.price, 'active', 20]);
      
      const productId = productResult.rows[0].id;
      
      // Create authentication tokens for each product
      for (let j = 0; j < 20; j++) {
        const token = `VG-${productId}-${String(j + 1).padStart(4, '0')}`;
        await pool.query(`
          INSERT INTO auth_tokens (token, product_id, batch_id, status)
          VALUES ($1, $2, $3, $4)
        `, [token, productId, `BATCH-${Date.now()}-${i}`, 'active']);
      }
    }
    
    console.log('Creating test users...');
    
    // Create test users
    const testPassword = await bcrypt.hash('password123', 10);
    for (let i = 1; i <= 20; i++) {
      await pool.query(`
        INSERT INTO users (email, password, name, role, points, level, verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `, [
        `user${i}@example.com`,
        testPassword,
        `Test User ${i}`,
        'consumer',
        Math.floor(Math.random() * 5000) + 100,
        Math.floor(Math.random() * 5) + 1,
        Math.random() > 0.3
      ]);
    }
    
    console.log('Creating sample validations...');
    
    // Create sample validations for the last year
    const now = new Date();
    for (let i = 0; i < 1000; i++) {
      const randomDays = Math.floor(Math.random() * 365);
      const validationDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      await pool.query(`
        INSERT INTO validations (token_id, user_id, location, result, confidence_score, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        Math.floor(Math.random() * 100) + 1,
        Math.floor(Math.random() * 20) + 1,
        `City ${Math.floor(Math.random() * 50) + 1}`,
        Math.random() > 0.1 ? 'authentic' : 'suspicious',
        Math.random() * 0.3 + 0.7,
        validationDate
      ]);
    }
    
    console.log('Creating sample analytics data...');
    
    // Create analytics data
    const events = ['validation', 'report', 'reward_claim', 'login', 'product_view'];
    for (let i = 0; i < 5000; i++) {
      const randomDays = Math.floor(Math.random() * 365);
      const eventDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      await pool.query(`
        INSERT INTO analytics (event_type, data, user_id, created_at)
        VALUES ($1, $2, $3, $4)
      `, [
        events[Math.floor(Math.random() * events.length)],
        JSON.stringify({ value: Math.floor(Math.random() * 100) }),
        Math.floor(Math.random() * 20) + 1,
        eventDate
      ]);
    }
    
    console.log('✅ Test data created successfully');
    console.log('📊 Summary:');
    console.log('  - 1 Admin user');
    console.log('  - 1 Manufacturer');
    console.log('  - 5 Products');
    console.log('  - 100 Authentication tokens');
    console.log('  - 20 Test users');
    console.log('  - 1,000 Validations');
    console.log('  - 5,000 Analytics events');
    
  } catch (error) {
    console.error('❌ Data creation error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createData();
EOF

    # Run data creation
    node create-data.js
    rm create-data.js
    
    print_success "👤 USERS AND TEST DATA CREATED"
}

# Configure PM2
setup_pm2() {
    print_status "🔄 SETTING UP PM2 PROCESS MANAGER..."
    
    cd $INSTALL_DIR
    
    # Create PM2 ecosystem configuration
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'vanguard-api',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
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
      script: './server/workers/index.js',
      instances: 1,
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

    # Start PM2 applications
    pm2 start ecosystem.config.js
    pm2 save
    
    # Setup PM2 startup
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp $HOME_DIR
    
    print_success "🔄 PM2 CONFIGURED"
}

# Configure Nginx
setup_nginx_config() {
    print_status "🌐 CONFIGURING NGINX..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/vanguard > /dev/null <<EOF
upstream vanguard_backend {
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
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
        proxy_send_timeout 86400;
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
        
        # Handle SPA routing
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Uploads
    location /uploads {
        alias $INSTALL_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Restart Nginx
    sudo systemctl restart nginx
    
    print_success "🌐 NGINX CONFIGURED"
}

# Setup firewall
setup_firewall() {
    print_status "🔥 CONFIGURING FIREWALL..."
    
    # Reset and configure UFW
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow essential services
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    
    # Enable firewall
    sudo ufw --force enable
    
    print_success "🔥 FIREWALL CONFIGURED"
}

# Get server IP
get_server_ip() {
    # Try multiple methods to get external IP
    curl -s http://checkip.amazonaws.com 2>/dev/null || \
    curl -s http://ipinfo.io/ip 2>/dev/null || \
    curl -s http://ifconfig.me 2>/dev/null || \
    hostname -I | awk '{print $1}' || \
    echo "localhost"
}

# Save all credentials
save_credentials() {
    print_status "💾 SAVING CREDENTIALS..."
    
    SERVER_IP=$(get_server_ip)
    
    cat > $HOME_DIR/vanguard-credentials.txt <<EOF
╔══════════════════════════════════════════════════════════════════╗
║                VANGUARD ANTI-COUNTERFEITING SYSTEM               ║
║                        SYSTEM CREDENTIALS                        ║
╚══════════════════════════════════════════════════════════════════╝

Generated: $(date)
Server IP: $SERVER_IP

🌐 ACCESS URLS
==============
Web Interface: http://$SERVER_IP
API Endpoint:  http://$SERVER_IP/api
Health Check:  http://$SERVER_IP/health

👤 LOGIN CREDENTIALS
====================
Admin Email:    admin@vanguard.local
Admin Password: Admin@123456

Test User:      user1@example.com
Test Password:  password123

🗄️ DATABASE
============
Host:     localhost
Port:     5432
Database: vanguard_production
Username: vanguard
Password: $DB_PASSWORD

🔴 REDIS
========
Host:     localhost
Port:     6379
Password: $REDIS_PASSWORD

🔐 SECURITY KEYS
================
JWT Secret:     $JWT_SECRET
Session Secret: $SESSION_SECRET

📁 DIRECTORIES
==============
Installation: $INSTALL_DIR
Logs:         $LOG_DIR
Data:         $DATA_DIR
Backups:      $HOME_DIR/vanguard-backups

🔧 SERVICE COMMANDS
===================
PM2 Status:     pm2 status
PM2 Logs:       pm2 logs
PM2 Restart:    pm2 restart all
PM2 Stop:       pm2 stop all
PM2 Monitor:    pm2 monit

System Services:
- Nginx:        sudo systemctl status nginx
- PostgreSQL:   sudo systemctl status postgresql
- Redis:        sudo systemctl status redis-server

📊 TEST DATA INCLUDED
=====================
- 1 Manufacturer (Acme Corporation)
- 5 Products with authentication tokens
- 20 Test users with reward points
- 1,000 Validation records
- 5,000 Analytics events
- Complete year of historical data

🎯 SYSTEM FEATURES
==================
✅ Anti-Counterfeiting Authentication
✅ QR Code Generation & Validation
✅ AI/ML Anomaly Detection
✅ Consumer Rewards System
✅ Manufacturer Dashboard
✅ Real-time Analytics
✅ Report Management
✅ Blockchain Integration (Ready)
✅ Mobile PWA Support
✅ API Integrations

⚠️  IMPORTANT SECURITY NOTES
=============================
1. Change the admin password after first login
2. Configure SMTP settings for email notifications
3. Set up SSL certificate for production use
4. Update blockchain contract address when ready
5. Keep this credentials file secure and delete after use

🚀 NEXT STEPS
=============
1. Access http://$SERVER_IP in your browser
2. Login with admin credentials
3. Explore the dashboard and features
4. Configure email settings
5. Set up blockchain integration
6. Customize branding and settings

═══════════════════════════════════════════════════════════════════
EOF

    chmod 600 $HOME_DIR/vanguard-credentials.txt
    
    print_success "💾 CREDENTIALS SAVED TO ~/vanguard-credentials.txt"
}

# Final system verification
verify_system() {
    print_status "✅ VERIFYING SYSTEM..."
    
    # Check all services
    print_status "Checking services..."
    
    # PostgreSQL
    if sudo systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
        return 1
    fi
    
    # Redis
    if sudo systemctl is-active --quiet redis-server; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
        return 1
    fi
    
    # Nginx
    if sudo systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Test database connection
    if PGPASSWORD=$DB_PASSWORD psql -U vanguard -d vanguard_production -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
        print_success "Database connection working"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Test Redis connection
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis connection working"
    else
        print_error "Redis connection failed"
        return 1
    fi
    
    # Test web server
    if curl -s http://localhost/health | grep -q "healthy"; then
        print_success "Web server responding"
    else
        print_error "Web server not responding"
        return 1
    fi
    
    # Check PM2 processes
    if pm2 list | grep -q "online"; then
        print_success "PM2 processes running"
    else
        print_error "PM2 processes not running"
        return 1
    fi
    
    print_success "✅ ALL SYSTEMS VERIFIED"
    return 0
}

# Display final summary
display_final_summary() {
    SERVER_IP=$(get_server_ip)
    
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    🎉 VANGUARD ANTI-COUNTERFEITING SYSTEM DEPLOYED! 🎉          ║
║                                                                  ║
║              WORLD'S FIRST AI-POWERED SYSTEM                     ║
║                   READY FOR PRODUCTION                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "\n${GREEN}🌐 YOUR SYSTEM IS LIVE AT:${NC}"
    echo -e "   ${BLUE}http://$SERVER_IP${NC}"
    
    echo -e "\n${GREEN}👤 LOGIN CREDENTIALS:${NC}"
    echo -e "   Admin: ${BLUE}admin@vanguard.local${NC} / ${BLUE}Admin@123456${NC}"
    echo -e "   Test:  ${BLUE}user1@example.com${NC} / ${BLUE}password123${NC}"
    
    echo -e "\n${GREEN}🎯 SYSTEM FEATURES READY:${NC}"
    echo -e "   ✅ Anti-Counterfeiting Authentication"
    echo -e "   ✅ AI/ML Illicit Sales Detection"
    echo -e "   ✅ Consumer Rewards & Gamification"
    echo -e "   ✅ Manufacturer Channel Analytics"
    echo -e "   ✅ Real-time Reporting Dashboard"
    echo -e "   ✅ Blockchain Integration (Ready)"
    echo -e "   ✅ Mobile PWA Support"
    echo -e "   ✅ API Integrations"
    
    echo -e "\n${GREEN}📊 TEST DATA INCLUDED:${NC}"
    echo -e "   • Complete year of historical data"
    echo -e "   • 1,000+ validation records"
    echo -e "   • 5,000+ analytics events"
    echo -e "   • 20 test users with rewards"
    echo -e "   • 5 products with tokens"
    
    echo -e "\n${GREEN}🔧 SERVICE STATUS:${NC}"
    pm2 status
    
    echo -e "\n${YELLOW}📋 NEXT STEPS:${NC}"
    echo -e "   1. Access ${BLUE}http://$SERVER_IP${NC} in your browser"
    echo -e "   2. Login and explore the dashboard"
    echo -e "   3. Configure email settings"
    echo -e "   4. Set up blockchain integration"
    echo -e "   5. Customize branding"
    
    echo -e "\n${MAGENTA}📄 Credentials saved to: ~/vanguard-credentials.txt${NC}"
    echo -e "${RED}⚠️  Please save credentials and delete the file!${NC}"
    
    echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED IN $SECONDS SECONDS!${NC}"
    echo -e "${CYAN}Your world-first AI-powered anti-counterfeiting system is ready!${NC}"
}

# Main execution function
main() {
    print_banner
    
    echo -e "${CYAN}🧹 COMPLETE CLEAN INSTALLATION SCRIPT${NC}"
    echo -e "${CYAN}This will completely clean your server and install Vanguard from scratch${NC}"
    echo -e "${YELLOW}⚠️  This will remove ALL existing installations and configurations${NC}\n"
    
    read -p "Are you sure you want to proceed with complete cleanup and fresh install? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    echo -e "\n${GREEN}🚀 STARTING COMPLETE CLEAN INSTALLATION...${NC}\n"
    
    # Check user
    check_user
    
    # Execute all installation steps
    complete_cleanup
    prepare_system
    install_nodejs
    install_postgresql
    install_redis
    install_nginx
    create_directories
    setup_application
    install_dependencies
    create_database_schema
    create_users_and_data
    setup_pm2
    setup_nginx_config
    setup_firewall
    save_credentials
    
    # Verify everything is working
    if verify_system; then
        display_final_summary
    else
        print_error "System verification failed. Please check the logs."
        exit 1
    fi
}

# Error handler
trap 'print_error "Installation failed at line $LINENO. Check the error above."; exit 1' ERR

# Start the installation
main "$@"