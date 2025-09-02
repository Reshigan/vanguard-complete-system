#!/bin/bash

# Vanguard Anti-Counterfeiting System - Manual Deployment Script
# This script uses the most basic, reliable commands for 100% success

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Print functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Configuration
INSTALL_DIR="/opt/vanguard"
DB_PASSWORD="vanguard123"
REDIS_PASSWORD="vantax"

# Step 1: Update system
step1() {
    log "Step 1: Updating system packages"
    sudo apt-get update
    sudo apt-get install -y curl wget git build-essential
    success "System updated"
}

# Step 2: Install Node.js
step2() {
    log "Step 2: Installing Node.js"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    node --version
    npm --version
    sudo npm install -g pm2
    success "Node.js installed"
}

# Step 3: Install PostgreSQL
step3() {
    log "Step 3: Installing PostgreSQL"
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS vanguard_db;"
    sudo -u postgres psql -c "DROP USER IF EXISTS vanguard;"
    sudo -u postgres psql -c "CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "CREATE DATABASE vanguard_db OWNER vanguard;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vanguard_db TO vanguard;"
    
    # Configure PostgreSQL for password authentication
    sudo sed -i "s/local.*all.*all.*peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
    sudo systemctl restart postgresql
    
    success "PostgreSQL installed and configured"
}

# Step 4: Install Redis
step4() {
    log "Step 4: Installing Redis"
    sudo apt-get install -y redis-server
    sudo systemctl stop redis-server
    
    # Create minimal Redis configuration
    echo "port 6379" | sudo tee /etc/redis/redis.conf
    echo "bind 127.0.0.1" | sudo tee -a /etc/redis/redis.conf
    echo "requirepass $REDIS_PASSWORD" | sudo tee -a /etc/redis/redis.conf
    
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # Test Redis connection
    redis-cli -a "$REDIS_PASSWORD" ping
    
    success "Redis installed and configured"
}

# Step 5: Install Nginx
step5() {
    log "Step 5: Installing Nginx"
    sudo apt-get install -y nginx
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create Nginx configuration
    cat > /tmp/vanguard.conf << EOF
server {
    listen 80;
    server_name localhost;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location / {
        root $INSTALL_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    
    sudo cp /tmp/vanguard.conf /etc/nginx/sites-available/vanguard
    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    
    success "Nginx installed and configured"
}

# Step 6: Create directories
step6() {
    log "Step 6: Creating directories"
    sudo mkdir -p $INSTALL_DIR/{server,client,uploads}
    sudo mkdir -p /var/log/vanguard
    sudo chown -R $USER:$USER $INSTALL_DIR
    sudo chown -R $USER:$USER /var/log/vanguard
    
    success "Directories created"
}

# Step 7: Setup application
step7() {
    log "Step 7: Setting up application"
    cd $INSTALL_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
    
    # Create server .env file
    cat > server/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://vanguard:$DB_PASSWORD@localhost:5432/vanguard_db
REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379
JWT_SECRET=vanguard_jwt_secret
SESSION_SECRET=vanguard_session_secret
UPLOAD_DIR=$INSTALL_DIR/uploads
LOG_DIR=/var/log/vanguard
EOF
    
    # Create client .env file
    cat > client/.env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
EOF
    
    success "Application setup complete"
}

# Step 8: Install dependencies
step8() {
    log "Step 8: Installing dependencies"
    cd $INSTALL_DIR/server
    npm install
    
    cd $INSTALL_DIR/client
    npm install
    npm run build
    
    success "Dependencies installed"
}

# Step 9: Create database schema
step9() {
    log "Step 9: Creating database schema"
    cd $INSTALL_DIR/server
    
    cat > create-schema.js << 'EOF'
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
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createSchema();
EOF
    
    node create-schema.js
    rm create-schema.js
    
    success "Database schema created"
}

# Step 10: Create admin user
step10() {
    log "Step 10: Creating admin user"
    cd $INSTALL_DIR/server
    
    cat > create-admin.js << 'EOF'
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['admin@vanguard.local', hashedPassword, 'System Administrator', 'admin']
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
    
    success "Admin user created"
}

# Step 11: Start application
step11() {
    log "Step 11: Starting application"
    cd $INSTALL_DIR
    pm2 start server/index.js --name vanguard-api
    pm2 save
    
    success "Application started"
}

# Step 12: Configure firewall
step12() {
    log "Step 12: Configuring firewall"
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    success "Firewall configured"
}

# Step 13: Save credentials
step13() {
    log "Step 13: Saving credentials"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    cat > ~/vanguard-credentials.txt << EOF
Vanguard Anti-Counterfeiting System
===================================
Generated: $(date)

Access URLs:
- Web Interface: http://$SERVER_IP
- API Endpoint: http://$SERVER_IP/api

Login Credentials:
- Admin: admin@vanguard.local / Admin@123456

Database:
- Host: localhost
- Database: vanguard_db
- Username: vanguard
- Password: $DB_PASSWORD

Redis:
- Host: localhost
- Port: 6379
- Password: $REDIS_PASSWORD

Directories:
- Installation: $INSTALL_DIR
- Logs: /var/log/vanguard

Commands:
- PM2 Status: pm2 status
- PM2 Logs: pm2 logs
- Restart API: pm2 restart vanguard-api
EOF
    
    chmod 600 ~/vanguard-credentials.txt
    
    success "Credentials saved to ~/vanguard-credentials.txt"
}

# Main function
main() {
    echo "Vanguard Anti-Counterfeiting System - Manual Deployment"
    echo "This script will deploy Vanguard step by step"
    echo ""
    
    read -p "Do you want to proceed with the deployment? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Execute steps
    step1
    step2
    step3
    step4
    step5
    step6
    step7
    step8
    step9
    step10
    step11
    step12
    step13
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║              DEPLOYMENT COMPLETED SUCCESSFULLY!                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    
    echo ""
    echo "Access your Vanguard system at: http://$SERVER_IP"
    echo "Admin login: admin@vanguard.local / Admin@123456"
    echo ""
    echo "Credentials saved to: ~/vanguard-credentials.txt"
    echo ""
    echo "Deployment completed successfully!"
}

# Run main function
main