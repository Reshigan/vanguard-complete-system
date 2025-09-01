#!/bin/bash

# Vanguard Anti-Counterfeiting System - AWS Linux Server Setup Script
# This script automates the complete installation and setup process
# Tested on Amazon Linux 2 and Ubuntu 20.04/22.04 LTS

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN_NAME="${DOMAIN_NAME:-}"
SSL_EMAIL="${SSL_EMAIL:-}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 64)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32)}"
NODE_ENV="${NODE_ENV:-production}"
APP_DIR="/opt/vanguard"
LOG_DIR="/var/log/vanguard"
BACKUP_DIR="/var/backups/vanguard"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
}

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    if [[ "$OS" == "amzn" ]]; then
        # Amazon Linux 2
        sudo yum update -y
        sudo yum install -y \
            git \
            gcc-c++ \
            make \
            openssl-devel \
            nginx \
            postgresql14-server \
            postgresql14 \
            redis6 \
            python3 \
            python3-pip \
            certbot \
            python3-certbot-nginx \
            htop \
            vim \
            curl \
            wget \
            unzip
            
        # Initialize PostgreSQL
        sudo postgresql-setup --initdb
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
        
    elif [[ "$OS" == "ubuntu" ]]; then
        # Ubuntu
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            git \
            nginx \
            postgresql \
            postgresql-contrib \
            redis-server \
            python3 \
            python3-pip \
            certbot \
            python3-certbot-nginx \
            htop \
            vim \
            curl \
            wget \
            unzip \
            software-properties-common
            
        # Start services
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
    else
        print_error "Unsupported OS: $OS"
        exit 1
    fi
    
    # Enable and start Redis
    sudo systemctl enable redis
    sudo systemctl start redis
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    
    # Install Node.js 18.x
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs || sudo apt-get install -y nodejs
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    # Install other global packages
    sudo npm install -g \
        typescript \
        @nestjs/cli \
        knex
    
    print_success "Node.js $(node --version) installed"
}

# Function to setup PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL..."
    
    # Create database and user
    sudo -u postgres psql <<EOF
CREATE USER vanguard WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE vanguard_production OWNER vanguard;
CREATE DATABASE vanguard_test OWNER vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_production TO vanguard;
GRANT ALL PRIVILEGES ON DATABASE vanguard_test TO vanguard;
ALTER USER vanguard CREATEDB;
EOF

    # Configure PostgreSQL for password authentication
    if [[ "$OS" == "amzn" ]]; then
        PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
        PG_CONFIG="/var/lib/pgsql/data/postgresql.conf"
        PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
    else
        PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+' | head -1)
        PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
        PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    fi
    
    # Enable password authentication
    sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" $PG_HBA
    sudo sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" $PG_HBA
    
    # Configure PostgreSQL for performance
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONFIG
    sudo sed -i "s/shared_buffers = .*/shared_buffers = 256MB/" $PG_CONFIG
    sudo sed -i "s/#effective_cache_size = .*/effective_cache_size = 1GB/" $PG_CONFIG
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    print_success "PostgreSQL configured"
}

# Function to setup Redis
setup_redis() {
    print_status "Setting up Redis..."
    
    # Find Redis configuration file
    REDIS_CONF=""
    for conf in "/etc/redis.conf" "/etc/redis/redis.conf" "/etc/redis/6379.conf"; do
        if [ -f "$conf" ]; then
            REDIS_CONF="$conf"
            break
        fi
    done
    
    if [ -z "$REDIS_CONF" ]; then
        print_warning "Redis config not found, creating one..."
        REDIS_CONF="/etc/redis/redis.conf"
        sudo mkdir -p /etc/redis
    fi
    
    # Configure Redis
    if [ -f "$REDIS_CONF" ]; then
        sudo cp $REDIS_CONF ${REDIS_CONF}.backup
        
        # Set password
        if grep -q "# requirepass foobared" $REDIS_CONF; then
            sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" $REDIS_CONF
        else
            echo "requirepass $REDIS_PASSWORD" | sudo tee -a $REDIS_CONF
        fi
        
        # Configure for production
        grep -q "^maxmemory" $REDIS_CONF || echo "maxmemory 512mb" | sudo tee -a $REDIS_CONF
        grep -q "^maxmemory-policy" $REDIS_CONF || echo "maxmemory-policy allkeys-lru" | sudo tee -a $REDIS_CONF
    else
        # Create minimal config
        cat << EOF | sudo tee $REDIS_CONF
bind 127.0.0.1
port 6379
requirepass $REDIS_PASSWORD
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
dir /var/lib/redis
EOF
    fi
    
    # Create directories
    sudo mkdir -p /var/lib/redis
    sudo chown redis:redis /var/lib/redis 2>/dev/null || true
    
    # Restart Redis
    sudo systemctl restart redis || sudo systemctl restart redis-server || sudo systemctl restart redis6
    
    print_success "Redis configured"
}

# Function to create application directories
create_directories() {
    print_status "Creating application directories..."
    
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p $APP_DIR/uploads
    sudo mkdir -p $APP_DIR/temp
    
    # Set permissions
    sudo chown -R $USER:$USER $APP_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    
    print_success "Directories created"
}

# Function to clone and setup application
setup_application() {
    print_status "Setting up application..."
    
    # Clone repository
    cd $APP_DIR
    git clone https://github.com/Reshigan/vanguard-complete-system.git .
    
    # Create environment files
    cat > $APP_DIR/server/.env <<EOF
NODE_ENV=$NODE_ENV
PORT=3000

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

# File uploads
UPLOAD_DIR=$APP_DIR/uploads
MAX_FILE_SIZE=10485760

# AI/ML
TENSORFLOW_BACKEND=cpu
ML_MODEL_PATH=$APP_DIR/server/services/ml/models

# Blockchain (update with your values)
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=

# Email (update with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@vanguard-auth.com

# AWS (if using S3 for uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

# Monitoring
SENTRY_DSN=
LOG_LEVEL=info
EOF

    cat > $APP_DIR/client/.env <<EOF
VITE_API_URL=https://${DOMAIN_NAME:-localhost}/api
VITE_APP_NAME=Vanguard Anti-Counterfeiting System
VITE_ENABLE_PWA=true
VITE_GOOGLE_MAPS_API_KEY=
EOF

    # Install dependencies
    print_status "Installing server dependencies..."
    cd $APP_DIR/server
    npm ci --production
    
    print_status "Installing client dependencies..."
    cd $APP_DIR/client
    npm ci
    
    # Build client
    print_status "Building client application..."
    npm run build
    
    # Run database migrations
    print_status "Running database migrations..."
    cd $APP_DIR/server
    npm run migrate
    
    # Generate initial test data (optional)
    if [[ "${GENERATE_TEST_DATA:-false}" == "true" ]]; then
        print_status "Generating test data..."
        npm run generate-data
    fi
    
    print_success "Application setup complete"
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > $APP_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'vanguard-api',
      script: '$APP_DIR/server/index.js',
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
      script: '$APP_DIR/server/workers/index.js',
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

    # Start applications with PM2
    cd $APP_DIR
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
    
    print_success "PM2 configured"
}

# Function to setup Nginx
setup_nginx() {
    print_status "Setting up Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/vanguard <<EOF
upstream vanguard_backend {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name ${DOMAIN_NAME:-_};
    
    # Redirect HTTP to HTTPS
    if (\$scheme != "https") {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME:-_};
    
    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
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
        root $APP_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /uploads {
        alias $APP_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configured"
}

# Function to setup SSL
setup_ssl() {
    if [[ -n "$DOMAIN_NAME" ]] && [[ -n "$SSL_EMAIL" ]]; then
        print_status "Setting up SSL certificate..."
        
        # Obtain SSL certificate
        sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL
        
        # Setup auto-renewal
        echo "0 0,12 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot-renew
        
        print_success "SSL certificate installed"
    else
        print_warning "Skipping SSL setup - DOMAIN_NAME or SSL_EMAIL not provided"
    fi
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    if [[ "$OS" == "ubuntu" ]]; then
        # UFW for Ubuntu
        sudo ufw --force enable
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw reload
    else
        # iptables for Amazon Linux
        sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
        sudo iptables -A INPUT -i lo -j ACCEPT
        sudo iptables -P INPUT DROP
        
        # Save iptables rules
        sudo service iptables save || sudo iptables-save > /etc/iptables/rules.v4
    fi
    
    print_success "Firewall configured"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Install monitoring tools
    if [[ "$OS" == "amzn" ]]; then
        sudo yum install -y amazon-cloudwatch-agent
    fi
    
    # Setup PM2 monitoring
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    
    # Create backup script
    cat > $BACKUP_DIR/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/vanguard"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="vanguard_production"

# Database backup
pg_dump -U vanguard -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 if configured
if [[ -n "$AWS_S3_BACKUP_BUCKET" ]]; then
    aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://$AWS_S3_BACKUP_BUCKET/
fi
EOF

    chmod +x $BACKUP_DIR/backup.sh
    
    # Setup cron for backups
    echo "0 2 * * * $BACKUP_DIR/backup.sh" | crontab -
    
    print_success "Monitoring configured"
}

# Function to display final information
display_info() {
    print_success "Installation complete!"
    
    echo -e "\n${GREEN}=== Installation Summary ===${NC}"
    echo -e "Application URL: ${BLUE}https://${DOMAIN_NAME:-your-domain.com}${NC}"
    echo -e "Application Directory: ${BLUE}$APP_DIR${NC}"
    echo -e "Log Directory: ${BLUE}$LOG_DIR${NC}"
    echo -e "\n${YELLOW}=== Database Credentials ===${NC}"
    echo -e "Database Name: ${BLUE}vanguard_production${NC}"
    echo -e "Database User: ${BLUE}vanguard${NC}"
    echo -e "Database Password: ${BLUE}$DB_PASSWORD${NC}"
    echo -e "\n${YELLOW}=== Redis Credentials ===${NC}"
    echo -e "Redis Password: ${BLUE}$REDIS_PASSWORD${NC}"
    echo -e "\n${YELLOW}=== Application Secrets ===${NC}"
    echo -e "JWT Secret: ${BLUE}$JWT_SECRET${NC}"
    
    echo -e "\n${GREEN}=== Next Steps ===${NC}"
    echo "1. Update environment variables in $APP_DIR/server/.env"
    echo "2. Configure your domain DNS to point to this server"
    echo "3. Run 'pm2 status' to check application status"
    echo "4. Run 'pm2 logs' to view application logs"
    echo "5. Access the application at https://${DOMAIN_NAME:-your-domain.com}"
    
    echo -e "\n${YELLOW}=== Important Commands ===${NC}"
    echo "View logs: pm2 logs"
    echo "Restart app: pm2 restart all"
    echo "Monitor app: pm2 monit"
    echo "Database console: psql -U vanguard -d vanguard_production"
    
    # Save credentials to file
    cat > $HOME/vanguard-credentials.txt <<EOF
Vanguard Anti-Counterfeiting System Credentials
Generated: $(date)

Database Password: $DB_PASSWORD
Redis Password: $REDIS_PASSWORD
JWT Secret: $JWT_SECRET

Keep this file secure and delete after saving credentials elsewhere.
EOF
    
    chmod 600 $HOME/vanguard-credentials.txt
    echo -e "\n${YELLOW}Credentials saved to: $HOME/vanguard-credentials.txt${NC}"
}

# Main installation flow
main() {
    print_status "Starting Vanguard Anti-Counterfeiting System installation..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
    
    # Detect OS
    detect_os
    
    # Run installation steps
    install_system_deps
    install_nodejs
    setup_postgresql
    setup_redis
    create_directories
    setup_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    setup_monitoring
    
    # Display final information
    display_info
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"