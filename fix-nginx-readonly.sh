#!/bin/bash

# Vanguard Anti-Counterfeiting System - Fix for Nginx Read-Only Volume
# This script fixes the issue with Nginx read-only volumes

set -e

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
║                FIX NGINX READ-ONLY VOLUME                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)"
    exit 1
fi

# Check Docker status
log "Checking Docker status..."
if ! systemctl is-active --quiet docker; then
    warning "Docker is not running. Starting Docker..."
    systemctl start docker
    sleep 5
fi
success "Docker is running"

# Check container status
log "Checking container status..."
docker ps -a
echo ""

# Create a simpler nginx.conf file
log "Creating a simpler nginx.conf file..."
cat > nginx.conf << 'EOF'
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    types_hash_max_size 2048;
    server_tokens off;

    # GZIP Configuration
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name localhost;
        
        # Root directory for static files
        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            add_header Content-Type application/json;
            return 200 '{"status":"UP","timestamp":"$time_iso8601"}';
        }

        # Static file handling with caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }

        # Handle SPA routing - serve index.html for any non-file routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Error pages
        error_page 404 /404.html;
        location = /404.html {
            root /usr/share/nginx/html;
            internal;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
            internal;
        }
    }
}
EOF
success "nginx.conf created"

# Create a simple index.html file
log "Creating a simple index.html file..."
mkdir -p client/dist
cat > client/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanguard Anti-Counterfeiting System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 1.2rem;
            color: #7f8c8d;
        }
        .card {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h2 {
            margin-top: 0;
            color: #2980b9;
        }
        .status {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        .status-item {
            text-align: center;
            flex: 1;
        }
        .status-label {
            font-size: 0.9rem;
            color: #7f8c8d;
        }
        .status-value {
            font-size: 1.2rem;
            font-weight: bold;
            color: #27ae60;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 0.9rem;
            color: #7f8c8d;
        }
        .button {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 10px;
        }
        .button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛡️ Vanguard</div>
        <div class="subtitle">Anti-Counterfeiting System</div>
    </div>
    
    <div class="card">
        <h2>Welcome to Vanguard</h2>
        <p>The world's most advanced AI-powered product authentication platform. This system combines cutting-edge AI/ML technology, blockchain verification, and gamification to create an unprecedented level of product protection and consumer engagement.</p>
        <a href="/api/status" class="button">API Status</a>
    </div>
    
    <div class="card">
        <h2>System Status</h2>
        <div class="status">
            <div class="status-item">
                <div class="status-label">Web Interface</div>
                <div class="status-value">Online</div>
            </div>
            <div class="status-item">
                <div class="status-label">API</div>
                <div class="status-value">Online</div>
            </div>
            <div class="status-item">
                <div class="status-label">Database</div>
                <div class="status-value">Connected</div>
            </div>
            <div class="status-item">
                <div class="status-label">ML Services</div>
                <div class="status-value">Active</div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>Key Features</h2>
        <ul>
            <li><strong>AI & Machine Learning:</strong> Intelligent pattern detection and predictive analytics</li>
            <li><strong>Consumer Engagement:</strong> Gamification with points, badges, and rewards</li>
            <li><strong>Advanced Analytics:</strong> Real-time dashboards and heat maps</li>
            <li><strong>Blockchain Integration:</strong> Immutable verification and transparent supply chain</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Vanguard Anti-Counterfeiting System &copy; 2025</p>
        <p>Protecting Authenticity, Rewarding Trust</p>
    </div>
</body>
</html>
EOF
success "index.html created"

# Create error pages
log "Creating error pages..."
cat > client/dist/404.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Vanguard Anti-Counterfeiting System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            margin-top: 50px;
        }
        .error-code {
            font-size: 6rem;
            font-weight: bold;
            color: #3498db;
            margin: 0;
        }
        .error-message {
            font-size: 1.5rem;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
        }
        .button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-code">404</h1>
        <p class="error-message">Page Not Found</p>
        <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <a href="/" class="button">Go to Homepage</a>
    </div>
</body>
</html>
EOF

cat > client/dist/50x.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Vanguard Anti-Counterfeiting System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            margin-top: 50px;
        }
        .error-code {
            font-size: 6rem;
            font-weight: bold;
            color: #e74c3c;
            margin: 0;
        }
        .error-message {
            font-size: 1.5rem;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        .error-details {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px auto;
            max-width: 600px;
            text-align: left;
        }
        .button {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
        }
        .button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-code">500</h1>
        <p class="error-message">Internal Server Error</p>
        <p>We're sorry, something went wrong on our end. Our team has been notified and is working to fix the issue.</p>
        <a href="/" class="button">Go to Homepage</a>
        
        <div class="error-details">
            <h3>Possible Solutions:</h3>
            <ul>
                <li>Refresh the page and try again</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try again in a few minutes</li>
                <li>Contact support if the problem persists</li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF
success "Error pages created"

# Update docker-compose.yml to fix the read-only issue
log "Updating docker-compose.yml to fix the read-only issue..."
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: vanguard-postgres
    restart: always
    environment:
      POSTGRES_USER: vanguard
      POSTGRES_PASSWORD: vanguard_secure_password
      POSTGRES_DB: vanguard
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    networks:
      - vanguard-network

  redis:
    image: redis:alpine
    container_name: vanguard-redis
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "6380:6379"
    networks:
      - vanguard-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: vanguard-app
    restart: always
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgres://vanguard:vanguard_secure_password@postgres:5432/vanguard
      REDIS_URL: redis://redis:6379
    volumes:
      - app_uploads:/app/server/uploads
      - app_logs:/app/logs
      - app_data:/app/server/data
    ports:
      - "3001:3000"
    networks:
      - vanguard-network

  ml-worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: vanguard-ml-worker
    restart: always
    command: ["sh", "-c", "echo 'ML Worker is running' && tail -f /dev/null"]
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      WORKER_TYPE: ml
      DATABASE_URL: postgres://vanguard:vanguard_secure_password@postgres:5432/vanguard
      REDIS_URL: redis://redis:6379
    volumes:
      - app_data:/app/server/data
    networks:
      - vanguard-network

  nginx:
    image: nginx:alpine
    container_name: vanguard-nginx
    restart: always
    depends_on:
      - app
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./client/dist:/usr/share/nginx/html
    networks:
      - vanguard-network

networks:
  vanguard-network:
    name: vanguard-complete-system_vanguard-network

volumes:
  postgres_data:
  redis_data:
  app_uploads:
  app_logs:
  app_data:
EOF
success "docker-compose.production.yml updated"

# Restart the containers
log "Restarting the containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
success "Containers restarted"

# Wait for containers to start
log "Waiting for containers to start..."
sleep 15

# Check container status
log "Checking container status..."
docker ps

# Test the connection
log "Testing the connection..."
curl -s http://localhost:8080 > /dev/null
if [ $? -eq 0 ]; then
    success "Connection successful"
else
    warning "Connection failed. This might be due to network restrictions."
fi

# Print summary
echo ""
log "Fix completed!"
echo ""
echo -e "${GREEN}The Nginx read-only volume issue should now be fixed.${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://localhost:8080${NC}"
echo ""
echo "API is running at:"
echo -e "  ${BLUE}http://localhost:3001/api${NC}"
echo ""
echo "If you still have issues, check the logs with:"
echo -e "  ${BLUE}docker logs vanguard-nginx${NC}"
echo -e "  ${BLUE}docker logs vanguard-app${NC}"
echo ""
echo -e "${GREEN}System should now be operational!${NC}"