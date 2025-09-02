#!/bin/bash

# Vanguard Anti-Counterfeiting System - Complete Deployment Script
# This script deploys the entire system with all features including ML and AI capabilities

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Print banner
echo -e "${BLUE}"
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
║                COMPLETE SYSTEM DEPLOYMENT                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
INSTALL_DIR="/opt/vanguard"
REPO_URL="https://github.com/Reshigan/vanguard-complete-system.git"
BRANCH="main"
NODE_VERSION="18"
DOMAIN="vanguard.example.com" # Change this to your domain
ADMIN_EMAIL="admin@example.com" # Change this to your email for SSL certificates

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    log "Detected OS: $OS $VERSION"
else
    error "Unsupported OS. This script requires Ubuntu or CentOS"
    exit 1
fi

# Install dependencies based on OS
log "Installing system dependencies..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    apt-get update
    apt-get install -y curl wget git build-essential libssl-dev nginx redis-server postgresql postgresql-contrib python3 python3-pip
elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
    yum -y update
    yum -y install curl wget git gcc gcc-c++ make openssl-devel nginx redis postgresql postgresql-server postgresql-contrib python3 python3-pip
    # Initialize PostgreSQL
    postgresql-setup --initdb
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
else
    error "Unsupported OS: $OS"
    exit 1
fi
success "System dependencies installed"

# Install Node.js
log "Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null || [[ $(node -v) != *"v$NODE_VERSION"* ]]; then
    curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-get install -y nodejs
    else
        yum -y install nodejs
    fi
    success "Node.js $NODE_VERSION installed"
else
    success "Node.js $NODE_VERSION is already installed"
fi

# Install PM2
log "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    success "PM2 installed"
else
    success "PM2 is already installed"
fi

# Install k6 for performance testing
log "Installing k6..."
if ! command -v k6 &> /dev/null; then
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
        apt-get update
        apt-get install -y k6
    else
        yum -y install https://dl.k6.io/rpm/k6-latest.rpm
    fi
    success "k6 installed"
else
    success "k6 is already installed"
fi

# Configure PostgreSQL
log "Configuring PostgreSQL..."
# Start PostgreSQL if not running
if ! systemctl is-active --quiet postgresql; then
    systemctl start postgresql
    systemctl enable postgresql
fi

# Create database and user
sudo -u postgres psql -c "CREATE USER vanguard WITH PASSWORD 'vanguard123';" || true
sudo -u postgres psql -c "CREATE DATABASE vanguard OWNER vanguard;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vanguard TO vanguard;" || true
success "PostgreSQL configured"

# Configure Redis
log "Configuring Redis..."
# Start Redis if not running
if ! systemctl is-active --quiet redis-server; then
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        systemctl start redis-server
        systemctl enable redis-server
    else
        systemctl start redis
        systemctl enable redis
    fi
fi

# Set Redis password
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    REDIS_CONF="/etc/redis/redis.conf"
else
    REDIS_CONF="/etc/redis.conf"
fi

# Check if Redis password is already set
if ! grep -q "^requirepass" $REDIS_CONF; then
    echo "requirepass vanguard123" >> $REDIS_CONF
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        systemctl restart redis-server
    else
        systemctl restart redis
    fi
    success "Redis password set"
else
    success "Redis password already configured"
fi

# Create installation directory
log "Creating installation directory..."
mkdir -p $INSTALL_DIR
success "Installation directory created"

# Clone repository
log "Cloning repository..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd $INSTALL_DIR
    git fetch
    git checkout $BRANCH
    git pull
    success "Repository updated"
else
    git clone --branch $BRANCH $REPO_URL $INSTALL_DIR
    success "Repository cloned"
fi

# Install server dependencies
log "Installing server dependencies..."
cd $INSTALL_DIR/server
npm install
success "Server dependencies installed"

# Install client dependencies and build
log "Installing client dependencies and building..."
cd $INSTALL_DIR/client
npm install
npm run build
success "Client built successfully"

# Configure environment variables
log "Configuring environment variables..."
cd $INSTALL_DIR/server
cp .env.example .env

# Update environment variables
sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://vanguard:vanguard123@localhost:5432/vanguard|g" .env
sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:vanguard123@localhost:6379|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|g" .env
sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=your-openai-api-key|g" .env
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
success "Environment variables configured"

# Run database migrations
log "Running database migrations..."
cd $INSTALL_DIR/server
npm run migrate
success "Database migrations completed"

# Generate test data
log "Generating test data..."
cd $INSTALL_DIR/server
node scripts/generate-full-year-data.js
success "Test data generated"

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/vanguard << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $INSTALL_DIR/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'";
    add_header Referrer-Policy no-referrer-when-downgrade;

    # Enable GZIP compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        application/javascript
        application/json
        application/x-javascript
        application/xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        root $INSTALL_DIR/client/dist;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Large client_max_body_size for file uploads
    client_max_body_size 10M;
}
EOF

# Enable site
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    # Remove default site if it exists
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm /etc/nginx/sites-enabled/default
    fi
else
    # For CentOS/RHEL
    ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/conf.d/vanguard.conf
fi

# Test Nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    systemctl enable nginx
    success "Nginx configured and restarted"
else
    error "Nginx configuration test failed"
    exit 1
fi

# Set up SSL with Let's Encrypt (optional)
if [ "$DOMAIN" != "vanguard.example.com" ]; then
    log "Setting up SSL with Let's Encrypt..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-get install -y certbot python3-certbot-nginx
    else
        yum -y install certbot python3-certbot-nginx
    fi
    
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL
    if [ $? -eq 0 ]; then
        success "SSL certificates installed"
    else
        warning "SSL certificate installation failed. Using HTTP instead."
    fi
else
    warning "Using example domain. Skipping SSL setup."
fi

# Set up PM2 for server and workers
log "Setting up PM2 for server and workers..."
cd $INSTALL_DIR
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'vanguard-api',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'vanguard-ml-worker',
      script: 'server/workers/ml-worker.js',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start the application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
success "PM2 configured and application started"

# Set up cron jobs for ML tasks and backups
log "Setting up cron jobs..."
(crontab -l 2>/dev/null || echo "") | grep -v "vanguard" > /tmp/crontab.tmp
cat >> /tmp/crontab.tmp << EOF
# Vanguard ML tasks
0 2 * * * cd $INSTALL_DIR && node server/scripts/trigger-ml-jobs.js > /var/log/vanguard/ml-jobs.log 2>&1
# Vanguard database backup
0 1 * * * cd $INSTALL_DIR && node server/scripts/backup-database.js > /var/log/vanguard/backup.log 2>&1
EOF
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp
success "Cron jobs set up"

# Create log directory
mkdir -p /var/log/vanguard
chown -R $(whoami):$(whoami) /var/log/vanguard

# Set up firewall
log "Configuring firewall..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    # UFW (Ubuntu)
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
    # Firewalld (CentOS/RHEL)
    systemctl start firewalld
    systemctl enable firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi
success "Firewall configured"

# Run tests to verify installation
log "Running tests to verify installation..."
cd $INSTALL_DIR
bash run-all-tests.sh
if [ $? -eq 0 ]; then
    success "All tests passed"
else
    warning "Some tests failed. Please check the logs for details."
fi

# Print summary
echo ""
log "Deployment completed!"
echo ""
echo -e "${GREEN}Vanguard Anti-Counterfeiting System has been successfully deployed!${NC}"
echo ""
echo "Access the application at:"
if [ "$DOMAIN" != "vanguard.example.com" ] && [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo -e "  ${GREEN}https://$DOMAIN${NC}"
else
    echo -e "  ${YELLOW}http://$DOMAIN${NC}"
fi
echo ""
echo "API is running at:"
echo -e "  ${BLUE}http://localhost:3000/api${NC}"
echo ""
echo "Default admin credentials:"
echo -e "  ${YELLOW}Email: admin@vanguard.local${NC}"
echo -e "  ${YELLOW}Password: Admin@123456${NC}"
echo ""
echo -e "${RED}IMPORTANT: Change the default admin password immediately after first login!${NC}"
echo ""
echo "Logs are available at:"
echo -e "  ${BLUE}PM2 logs: pm2 logs${NC}"
echo -e "  ${BLUE}Application logs: /var/log/vanguard/${NC}"
echo -e "  ${BLUE}Nginx logs: /var/log/nginx/${NC}"
echo ""
echo -e "To update the application in the future, run:"
echo -e "  ${BLUE}cd $INSTALL_DIR && git pull && npm run deploy${NC}"
echo ""
echo -e "${GREEN}Thank you for choosing Vanguard Anti-Counterfeiting System!${NC}"