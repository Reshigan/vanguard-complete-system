#!/bin/bash

# Fix deployment continuation issues
# This handles the case where directories already exist

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
INSTALL_DIR="${INSTALL_DIR:-/opt/vanguard}"
LOG_DIR="${LOG_DIR:-/var/log/vanguard}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vanguard}"
DATA_DIR="${DATA_DIR:-/var/lib/vanguard}"

# Use your Redis password
REDIS_PASSWORD="vantax"

# Get database password from previous run or generate new one
if [ -f ~/vanguard-credentials.txt ]; then
    DB_PASSWORD=$(grep "Password:" ~/vanguard-credentials.txt | grep -v "Redis" | tail -1 | awk '{print $2}')
fi
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

# Generate other secrets
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)}"
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

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

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║              VANGUARD DEPLOYMENT FIX & CONTINUE                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check current user
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Will fix permissions later."
    SUDO=""
else
    SUDO="sudo"
fi

# Check if Redis is working
print_status "Checking Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    print_success "Redis is working correctly"
else
    print_error "Redis is not responding. Please run ./quick-redis-fix.sh first"
    exit 1
fi

# Check if PostgreSQL is running
print_status "Checking PostgreSQL..."
if $SUDO systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL is not running"
    $SUDO systemctl start postgresql
fi

# Handle existing installation directory
print_status "Checking installation directory..."
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Installation directory already exists at $INSTALL_DIR"
    
    # Check if it's a git repository
    if [ -d "$INSTALL_DIR/.git" ]; then
        print_info "Found existing git repository, updating..."
        cd $INSTALL_DIR
        git stash
        git pull origin main
        git stash pop || true
    else
        # Check if it has any important files
        if [ -f "$INSTALL_DIR/server/package.json" ]; then
            print_info "Found existing installation files"
        else
            print_warning "Directory exists but appears incomplete. Backing up and starting fresh..."
            $SUDO mv $INSTALL_DIR ${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)
            $SUDO mkdir -p $INSTALL_DIR
            $SUDO chown -R $USER:$USER $INSTALL_DIR
            cd $INSTALL_DIR
            git clone https://github.com/Reshigan/vanguard-complete-system.git .
        fi
    fi
else
    # Create fresh installation
    print_status "Creating installation directory..."
    $SUDO mkdir -p $INSTALL_DIR
    $SUDO chown -R $USER:$USER $INSTALL_DIR
    cd $INSTALL_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
fi

# Ensure we're in the right directory
cd $INSTALL_DIR

# Create/update environment file
print_status "Creating environment configuration..."
cat > $INSTALL_DIR/server/.env <<EOF
# Vanguard Anti-Counterfeiting System Configuration
# Generated on $(date)

# Application
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

# Create client environment file
cat > $INSTALL_DIR/client/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

print_success "Environment configuration created"

# Fix permissions
print_status "Fixing permissions..."
$SUDO chown -R $USER:$USER $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

# Install dependencies
print_status "Installing server dependencies..."
cd $INSTALL_DIR/server
npm ci || npm install

print_status "Installing client dependencies..."
cd $INSTALL_DIR/client
npm ci || npm install

print_status "Building client application..."
npm run build
print_success "Client built successfully"

# Check if database exists
print_status "Checking database..."
if $SUDO -u postgres psql -lqt | cut -d \| -f 1 | grep -qw vanguard_production; then
    print_info "Database already exists"
else
    print_status "Creating database..."
    $SUDO -u postgres psql <<EOF
CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE vanguard_production OWNER vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_production TO vanguard;
\c vanguard_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
fi

# Run database migrations
print_status "Running database migrations..."
cd $INSTALL_DIR/server
npx knex migrate:latest --env production || {
    print_warning "Migration failed, trying with development config..."
    NODE_ENV=production npx knex migrate:latest
}
print_success "Database migrations completed"

# Generate test data
read -p "Generate test data? (y/N): " gen_test
if [ "$gen_test" = "y" ] || [ "$gen_test" = "Y" ]; then
    print_status "Generating test data..."
    if [ -f "scripts/generateTestData.js" ]; then
        node scripts/generateTestData.js
    fi
    print_success "Test data generated"
fi

# Create admin user
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

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    $SUDO npm install -g pm2
fi

# Setup PM2
print_status "Setting up PM2 process manager..."
cd $INSTALL_DIR

# Stop any existing PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

cat > ecosystem.config.js <<EOF
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
      watch: false
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

pm2 start ecosystem.config.js
pm2 save
$SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
print_success "PM2 configured and applications started"

# Setup Nginx
print_status "Setting up Nginx..."
read -p "Enter your domain name (or press Enter for localhost): " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-localhost}

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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    client_max_body_size 10M;
    
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
    
    location /socket.io {
        proxy_pass http://vanguard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location / {
        root $INSTALL_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads {
        alias $INSTALL_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

$SUDO ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t
$SUDO systemctl restart nginx
print_success "Nginx configured"

# Get server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "localhost")

# Save credentials
cat > ~/vanguard-credentials.txt <<EOF
Vanguard Anti-Counterfeiting System
Installation Summary
Generated: $(date)

=== Access URLs ===
Web Interface: http://$DOMAIN_NAME
API Endpoint: http://$DOMAIN_NAME/api
Direct IP Access: http://$SERVER_IP

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

=== Service Commands ===
PM2 Status: pm2 status
PM2 Logs: pm2 logs
Restart API: pm2 restart vanguard-api
Restart Worker: pm2 restart vanguard-worker
Nginx Status: sudo systemctl status nginx
Redis Status: sudo systemctl status redis-server
PostgreSQL Status: sudo systemctl status postgresql
EOF

chmod 600 ~/vanguard-credentials.txt

# Display summary
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DEPLOYMENT COMPLETED SUCCESSFULLY!                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}=== Access Information ===${NC}"
echo -e "Web Interface: ${BLUE}http://$DOMAIN_NAME${NC}"
if [ "$DOMAIN_NAME" = "localhost" ] && [ "$SERVER_IP" != "localhost" ]; then
    echo -e "External Access: ${BLUE}http://$SERVER_IP${NC}"
fi
echo -e "API Endpoint: ${BLUE}http://$DOMAIN_NAME/api${NC}"

echo -e "\n${CYAN}=== Default Credentials ===${NC}"
echo -e "Admin Email: ${BLUE}admin@vanguard.local${NC}"
echo -e "Admin Password: ${BLUE}Admin@123456${NC}"

echo -e "\n${CYAN}=== Service Status ===${NC}"
pm2 status

echo -e "\n${GREEN}Credentials saved to: ~/vanguard-credentials.txt${NC}"
echo -e "${YELLOW}Please save these credentials and delete the file!${NC}"

echo -e "\n${MAGENTA}Next Steps:${NC}"
echo "1. Access the web interface at http://$DOMAIN_NAME"
if [ "$DOMAIN_NAME" = "localhost" ] && [ "$SERVER_IP" != "localhost" ]; then
    echo "   Or use: http://$SERVER_IP"
fi
echo "2. Login with the admin credentials"
echo "3. Change the admin password"
echo "4. Configure email settings if needed"

print_success "Vanguard Anti-Counterfeiting System is now live!"