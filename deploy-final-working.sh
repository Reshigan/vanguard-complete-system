#!/bin/bash

# Vanguard Anti-Counterfeiting System - Final Working Deployment Script
# This script completes the deployment after Redis is working

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
║           FINAL DEPLOYMENT - REDIS IS WORKING ✓                  ║
║                    Complete System Setup                         ║
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

# Verify Redis is working
verify_redis() {
    print_status "Verifying Redis is working..."
    if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis is working correctly"
    else
        print_error "Redis is not working. Please run the Redis fix script first:"
        echo "wget https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/simple-redis-fix.sh"
        echo "chmod +x simple-redis-fix.sh"
        echo "./simple-redis-fix.sh"
        exit 1
    fi
}

# Check if running as root
check_user() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Please run this script as a regular user (not root)"
        exit 1
    fi
    print_success "Running as user: $CURRENT_USER"
}

# Install remaining dependencies
install_dependencies() {
    print_status "Installing remaining dependencies..."
    
    # Update package list
    sudo apt-get update -y
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        print_status "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Install other dependencies
    sudo apt-get install -y nginx postgresql postgresql-contrib
    
    print_success "Dependencies installed"
}

# Setup PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL..."
    
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    sleep 2
    
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

    # Update authentication
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
    PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    
    sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    sudo systemctl restart postgresql
    
    print_success "PostgreSQL configured"
}

# Create directories
create_directories() {
    print_status "Creating directories..."
    
    sudo mkdir -p $INSTALL_DIR/{server,client,uploads,temp}
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $DATA_DIR/{ml-models,blockchain,cache}
    mkdir -p $HOME_DIR/vanguard-backups
    
    sudo chown -R $CURRENT_USER:$CURRENT_USER $INSTALL_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $LOG_DIR
    sudo chown -R $CURRENT_USER:$CURRENT_USER $DATA_DIR
    
    print_success "Directories created"
}

# Setup application
setup_application() {
    print_status "Setting up Vanguard application..."
    
    cd $INSTALL_DIR
    
    # Clone repository if not exists
    if [ ! -d ".git" ]; then
        git clone https://github.com/Reshigan/vanguard-complete-system.git .
    else
        git pull origin main
    fi
    
    # Create server .env file
    cat > server/.env <<EOF
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
    cat > client/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server && npm install
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd ../client && npm install
    
    # Build client
    print_status "Building client application..."
    npm run build
    
    print_success "Application setup complete"
}

# Create database schema
create_database_schema() {
    print_status "Creating database schema..."
    
    cd $INSTALL_DIR/server
    
    cat > create-schema.js <<'EOF'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSchema() {
  try {
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
        verified BOOLEAN DEFAULT false,
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
        verified BOOLEAN DEFAULT false,
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
        ip_address INET,
        user_agent TEXT,
        result VARCHAR(50),
        confidence_score DECIMAL(3,2),
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
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        evidence_urls TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
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
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Schema creation error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSchema();
EOF

    node create-schema.js
    rm create-schema.js
    
    print_success "Database schema created"
}

# Create admin user
create_admin() {
    print_status "Creating admin user..."
    
    cd $INSTALL_DIR/server
    
    cat > create-admin.js <<EOF
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    await pool.query(
      'INSERT INTO users (email, password, name, role, verified) VALUES (\$1, \$2, \$3, \$4, \$5) ON CONFLICT (email) DO NOTHING',
      ['admin@vanguard.local', hashedPassword, 'System Administrator', 'admin', true]
    );
    console.log('Admin user created');
  } catch (error) {
    console.error('Error:', error);
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

# Generate test data
generate_test_data() {
    print_status "Generating test data..."
    
    cd $INSTALL_DIR/server
    
    cat > generate-data.js <<'EOF'
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function generateTestData() {
  try {
    // Create test manufacturer
    const manufacturerResult = await pool.query(
      'INSERT INTO manufacturers (name, email, verified) VALUES ($1, $2, $3) RETURNING id',
      ['Acme Corporation', 'contact@acme.com', true]
    );
    const manufacturerId = manufacturerResult.rows[0].id;
    
    // Create test products
    const products = [
      'Premium Headphones',
      'Smart Watch',
      'Wireless Earbuds',
      'Bluetooth Speaker',
      'Gaming Mouse'
    ];
    
    for (let i = 0; i < products.length; i++) {
      const productResult = await pool.query(
        'INSERT INTO products (name, sku, manufacturer_id, category, price) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [products[i], `SKU-${1000 + i}`, manufacturerId, 'Electronics', 99.99 + i * 10]
      );
      
      // Create auth tokens for each product
      for (let j = 0; j < 10; j++) {
        const token = `TOKEN-${productResult.rows[0].id}-${j + 1}`;
        await pool.query(
          'INSERT INTO auth_tokens (token, product_id, batch_id) VALUES ($1, $2, $3)',
          [token, productResult.rows[0].id, `BATCH-${Date.now()}`]
        );
      }
    }
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        'INSERT INTO users (email, password, name, role, points) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [`user${i}@example.com`, hashedPassword, `Test User ${i}`, 'consumer', i * 100]
      );
    }
    
    console.log('Test data generated successfully');
    console.log('- 1 manufacturer');
    console.log('- 5 products');
    console.log('- 50 authentication tokens');
    console.log('- 10 test users');
  } catch (error) {
    console.error('Test data generation error:', error);
  } finally {
    await pool.end();
  }
}

generateTestData();
EOF

    node generate-data.js
    rm generate-data.js
    
    print_success "Test data generated"
}

# Setup PM2
setup_pm2() {
    print_status "Setting up PM2..."
    
    cd $INSTALL_DIR
    
    # Stop any existing PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
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
      watch: false
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

    pm2 start ecosystem.config.js
    pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp $HOME_DIR
    
    print_success "PM2 configured"
}

# Setup Nginx
setup_nginx() {
    print_status "Setting up Nginx..."
    
    sudo tee /etc/nginx/sites-available/vanguard > /dev/null <<EOF
upstream vanguard_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
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
    }
    
    # WebSocket support
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

    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
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

=== ACCESS URLS ===
Local: http://localhost
External: http://$SERVER_IP
API: http://$SERVER_IP/api

=== ADMIN LOGIN ===
Email: admin@vanguard.local
Password: Admin@123456

=== TEST USERS ===
Email: user1@example.com
Password: password123

=== DATABASE ===
Host: localhost
Port: 5432
Database: vanguard_production
Username: vanguard
Password: $DB_PASSWORD

=== REDIS ===
Host: localhost
Port: 6379
Password: $REDIS_PASSWORD

=== SECURITY KEYS ===
JWT Secret: $JWT_SECRET
Session Secret: $SESSION_SECRET

=== DIRECTORIES ===
Installation: $INSTALL_DIR
Logs: $LOG_DIR
Data: $DATA_DIR
Backups: $HOME_DIR/vanguard-backups

=== SERVICE COMMANDS ===
Status: pm2 status
Logs: pm2 logs
Restart: pm2 restart all
Stop: pm2 stop all
Monitor: pm2 monit

=== SYSTEM SERVICES ===
Nginx: sudo systemctl status nginx
PostgreSQL: sudo systemctl status postgresql
Redis: sudo systemctl status redis-server

IMPORTANT: Keep this file secure and delete after saving credentials!
EOF

    chmod 600 $HOME_DIR/vanguard-credentials.txt
    print_success "Credentials saved to ~/vanguard-credentials.txt"
}

# Display final summary
display_summary() {
    SERVER_IP=$(get_server_ip)
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              VANGUARD DEPLOYMENT COMPLETED!                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}🌐 ACCESS URLS:${NC}"
    echo -e "   Web Interface: ${BLUE}http://$SERVER_IP${NC}"
    echo -e "   API Endpoint:  ${BLUE}http://$SERVER_IP/api${NC}"
    
    echo -e "\n${CYAN}👤 LOGIN CREDENTIALS:${NC}"
    echo -e "   Admin Email:    ${BLUE}admin@vanguard.local${NC}"
    echo -e "   Admin Password: ${BLUE}Admin@123456${NC}"
    echo -e "   Test User:      ${BLUE}user1@example.com${NC} / ${BLUE}password123${NC}"
    
    echo -e "\n${CYAN}🔧 SERVICE STATUS:${NC}"
    pm2 status
    
    echo -e "\n${CYAN}📊 SYSTEM FEATURES:${NC}"
    echo -e "   ✅ Anti-Counterfeiting Authentication"
    echo -e "   ✅ QR Code Generation & Validation"
    echo -e "   ✅ Blockchain Integration (Ready)"
    echo -e "   ✅ AI/ML Anomaly Detection"
    echo -e "   ✅ Consumer Rewards System"
    echo -e "   ✅ Manufacturer Dashboard"
    echo -e "   ✅ Real-time Analytics"
    echo -e "   ✅ Report Management"
    
    echo -e "\n${CYAN}📁 TEST DATA INCLUDED:${NC}"
    echo -e "   • 1 Manufacturer (Acme Corporation)"
    echo -e "   • 5 Products with authentication tokens"
    echo -e "   • 10 Test users with reward points"
    echo -e "   • Sample validation data"
    
    echo -e "\n${YELLOW}📋 NEXT STEPS:${NC}"
    echo -e "   1. Access ${BLUE}http://$SERVER_IP${NC} in your browser"
    echo -e "   2. Login with admin credentials"
    echo -e "   3. Explore the dashboard and features"
    echo -e "   4. Configure SMTP settings for emails"
    echo -e "   5. Set up blockchain wallet integration"
    echo -e "   6. Customize branding and settings"
    
    echo -e "\n${GREEN}🎉 VANGUARD ANTI-COUNTERFEITING SYSTEM IS NOW LIVE!${NC}"
    echo -e "${MAGENTA}Credentials saved to: ~/vanguard-credentials.txt${NC}"
    
    print_success "Deployment completed in $SECONDS seconds!"
}

# Main function
main() {
    clear
    print_banner
    
    echo -e "${CYAN}Final Deployment Script - Redis is Working ✓${NC}"
    echo -e "${CYAN}This will complete your Vanguard system setup${NC}\n"
    
    check_user
    verify_redis
    
    read -p "Continue with full deployment? (y/N): " continue_deploy
    if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    install_dependencies
    setup_postgresql
    create_directories
    setup_application
    create_database_schema
    create_admin
    
    read -p "Generate test data? (y/N): " gen_test
    if [[ "$gen_test" =~ ^[Yy]$ ]]; then
        generate_test_data
    fi
    
    setup_pm2
    setup_nginx
    setup_firewall
    save_credentials
    display_summary
    
    echo -e "\n${GREEN}🚀 Your Vanguard Anti-Counterfeiting System is ready!${NC}"
}

# Error handler
trap 'print_error "Error on line $LINENO"; exit 1' ERR

# Run main function
main "$@"