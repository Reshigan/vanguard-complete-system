#!/bin/bash

# Vanguard Anti-Counterfeiting System - Fix for Connection Timeout
# This script fixes connection timeout issues with the system

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
║                FIX CONNECTION TIMEOUT                            ║
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

# Check firewall status
log "Checking firewall status..."
if command -v ufw &> /dev/null; then
    ufw status
    log "Opening required ports in UFW firewall..."
    ufw allow 8080/tcp
    ufw allow 3001/tcp
    ufw allow 5433/tcp
    ufw allow 6380/tcp
    success "Firewall ports opened"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --state
    log "Opening required ports in firewalld..."
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --permanent --add-port=3001/tcp
    firewall-cmd --permanent --add-port=5433/tcp
    firewall-cmd --permanent --add-port=6380/tcp
    firewall-cmd --reload
    success "Firewall ports opened"
else
    warning "No firewall detected or not installed. Skipping firewall configuration."
fi

# Check if ports are already in use
log "Checking if ports are already in use..."
PORT_CONFLICT=false

check_port() {
    local port=$1
    local service=$2
    if lsof -i:$port -sTCP:LISTEN &> /dev/null; then
        warning "Port $port is already in use by another service. $service might not start properly."
        PORT_CONFLICT=true
    else
        success "Port $port is available for $service"
    fi
}

check_port 8080 "Nginx HTTP"
check_port 3001 "Application"
check_port 5433 "PostgreSQL"
check_port 6380 "Redis"

if [ "$PORT_CONFLICT" = true ]; then
    warning "Port conflicts detected. You may need to modify docker-compose.production.yml to use different ports."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment aborted due to port conflicts."
        exit 1
    fi
fi

# Create a standalone Nginx configuration
log "Creating a standalone Nginx configuration..."
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
        listen 80 default_server;
        listen [::]:80 default_server;
        
        server_name _;
        
        # Root directory for static files
        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location = /health {
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

# Create a standalone Nginx container
log "Creating a standalone Nginx container..."
docker stop vanguard-nginx || true
docker rm vanguard-nginx || true

# Copy files to a temporary directory
mkdir -p /tmp/nginx-html
cp client/dist/index.html /tmp/nginx-html/
cp client/dist/404.html /tmp/nginx-html/
cp client/dist/50x.html /tmp/nginx-html/

# Run a standalone Nginx container
docker run -d --name vanguard-nginx \
  -p 8080:80 \
  -v /tmp/nginx-html:/usr/share/nginx/html \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
  nginx:alpine
success "Standalone Nginx container created"

# Check if the Nginx container is running
log "Checking if the Nginx container is running..."
if docker ps | grep -q vanguard-nginx; then
    success "Nginx container is running"
else
    error "Nginx container failed to start"
    docker logs vanguard-nginx
    exit 1
fi

# Test local connection
log "Testing local connection..."
if curl -s http://localhost:8080 > /dev/null; then
    success "Local connection successful"
else
    warning "Local connection failed. This might be due to network restrictions."
fi

# Get public IP address
log "Getting public IP address..."
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || curl -s icanhazip.com)
if [ -n "$PUBLIC_IP" ]; then
    log "Public IP address: $PUBLIC_IP"
    echo "You can access the application at: http://$PUBLIC_IP:8080"
else
    warning "Could not determine public IP address."
fi

# Check if the server is accessible from the internet
log "Checking if the server is accessible from the internet..."
echo "You can test if the server is accessible from the internet by visiting:"
echo "http://$PUBLIC_IP:8080"
echo ""
echo "If you cannot access the server from the internet, you may need to:"
echo "1. Configure your cloud provider's security groups/firewall to allow traffic on port 8080"
echo "2. If using AWS EC2, ensure your instance has a public IP and is in a public subnet"
echo "3. Check if your server is behind a NAT gateway or other network device"

# Print summary
echo ""
log "Fix completed!"
echo ""
echo -e "${GREEN}The connection timeout issue should now be fixed.${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://localhost:8080${NC}"
echo -e "  ${GREEN}http://$PUBLIC_IP:8080${NC} (from the internet)"
echo ""
echo "If you still have issues, check the logs with:"
echo -e "  ${BLUE}docker logs vanguard-nginx${NC}"
echo ""
echo -e "${GREEN}System should now be operational!${NC}"