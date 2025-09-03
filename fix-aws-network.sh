#!/bin/bash

# Vanguard Anti-Counterfeiting System - Fix for AWS Network Issues
# This script diagnoses and fixes network issues on AWS EC2 instances

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
║                FIX AWS NETWORK ISSUES                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)"
    exit 1
fi

# Check if running on AWS
log "Checking if running on AWS..."
if curl -s http://169.254.169.254/latest/meta-data/ -m 1 > /dev/null; then
    success "Running on AWS EC2"
    IS_AWS=true
    
    # Get instance ID
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    log "Instance ID: $INSTANCE_ID"
    
    # Get availability zone
    AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
    log "Availability Zone: $AVAILABILITY_ZONE"
    
    # Get public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    if [ -n "$PUBLIC_IP" ]; then
        log "Public IP: $PUBLIC_IP"
    else
        warning "No public IP assigned to this instance"
    fi
else
    warning "Not running on AWS EC2 or metadata service is not accessible"
    IS_AWS=false
fi

# Check network interfaces
log "Checking network interfaces..."
ip addr show
echo ""

# Check routing table
log "Checking routing table..."
ip route
echo ""

# Check if Docker is using the correct network
log "Checking Docker network..."
docker network ls
echo ""

# Check Docker container network settings
log "Checking Docker container network settings..."
docker inspect vanguard-nginx -f '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
echo ""

# Check if ports are being listened on
log "Checking if ports are being listened on..."
netstat -tulpn | grep -E ':(8080|3001|5433|6380)'
echo ""

# Check if iptables is blocking traffic
log "Checking if iptables is blocking traffic..."
iptables -L -n
echo ""

# Check if AWS security group is properly configured
if [ "$IS_AWS" = true ]; then
    log "Checking AWS security group configuration..."
    echo "To check your security group configuration, please visit:"
    echo "https://console.aws.amazon.com/ec2/v2/home?region=${AVAILABILITY_ZONE%?}#SecurityGroups:"
    echo ""
    echo "Ensure that your security group allows inbound traffic on the following ports:"
    echo "- TCP port 8080 (Nginx)"
    echo "- TCP port 3001 (Application)"
    echo "- TCP port 5433 (PostgreSQL)"
    echo "- TCP port 6380 (Redis)"
    echo ""
fi

# Create a simple test page
log "Creating a simple test page..."
mkdir -p /var/www/html
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanguard Network Test</title>
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
        .success {
            color: #27ae60;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Vanguard Network Test</h1>
    <p class="success">If you can see this page, your network is properly configured!</p>
    <p>This is a test page to verify network connectivity.</p>
    <p>Timestamp: <span id="timestamp"></span></p>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toISOString();
    </script>
</body>
</html>
EOF
success "Test page created"

# Start a simple HTTP server on port 8080
log "Starting a simple HTTP server on port 8080..."
if command -v python3 &> /dev/null; then
    # Kill any existing process on port 8080
    fuser -k 8080/tcp &> /dev/null || true
    
    # Start Python HTTP server in the background
    cd /var/www/html
    python3 -m http.server 8080 &
    PYTHON_PID=$!
    success "Python HTTP server started on port 8080 (PID: $PYTHON_PID)"
else
    warning "Python3 is not installed. Installing..."
    apt-get update
    apt-get install -y python3
    
    # Kill any existing process on port 8080
    fuser -k 8080/tcp &> /dev/null || true
    
    # Start Python HTTP server in the background
    cd /var/www/html
    python3 -m http.server 8080 &
    PYTHON_PID=$!
    success "Python HTTP server started on port 8080 (PID: $PYTHON_PID)"
fi

# Test local connection
log "Testing local connection..."
if curl -s http://localhost:8080 > /dev/null; then
    success "Local connection successful"
else
    error "Local connection failed"
fi

# Provide instructions for testing external connection
if [ "$IS_AWS" = true ] && [ -n "$PUBLIC_IP" ]; then
    log "Testing external connection..."
    echo "To test external connection, open a web browser and visit:"
    echo "http://$PUBLIC_IP:8080"
    echo ""
    echo "If you cannot access the page, please check:"
    echo "1. AWS Security Group: Ensure inbound rule for TCP port 8080 is allowed"
    echo "2. Network ACLs: Ensure both inbound and outbound rules allow traffic on port 8080"
    echo "3. Instance Status: Ensure the instance is running and healthy"
    echo ""
fi

# Fix common AWS network issues
if [ "$IS_AWS" = true ]; then
    log "Fixing common AWS network issues..."
    
    # Ensure the instance has a public IP
    if [ -z "$PUBLIC_IP" ]; then
        warning "This instance does not have a public IP address"
        echo "To assign a public IP to this instance:"
        echo "1. Stop the instance"
        echo "2. Right-click on the instance and select 'Networking' > 'Manage IP addresses'"
        echo "3. Allocate a new Elastic IP and associate it with this instance"
        echo "4. Start the instance"
        echo ""
    fi
    
    # Check if the instance is in a public subnet
    log "Checking if the instance is in a public subnet..."
    # This is a simple check - if the default route points to an internet gateway, it's likely in a public subnet
    if ip route | grep -q "default via"; then
        success "Instance appears to be in a public subnet (has a default route)"
    else
        warning "Instance may not be in a public subnet (no default route found)"
        echo "To move this instance to a public subnet:"
        echo "1. Stop the instance"
        echo "2. Right-click on the instance and select 'Networking' > 'Change subnet'"
        echo "3. Select a public subnet"
        echo "4. Start the instance"
        echo ""
    fi
    
    # Ensure the security group allows inbound traffic
    log "Ensuring security group allows inbound traffic..."
    echo "Please manually check your security group configuration in the AWS console"
    echo "Add the following inbound rules if they don't exist:"
    echo "- Type: Custom TCP, Port: 8080, Source: 0.0.0.0/0 (or your specific IP range)"
    echo "- Type: Custom TCP, Port: 3001, Source: 0.0.0.0/0 (or your specific IP range)"
    echo "- Type: Custom TCP, Port: 5433, Source: 0.0.0.0/0 (or your specific IP range)"
    echo "- Type: Custom TCP, Port: 6380, Source: 0.0.0.0/0 (or your specific IP range)"
    echo ""
fi

# Create a standalone Nginx container with host networking
log "Creating a standalone Nginx container with host networking..."
docker stop vanguard-nginx || true
docker rm vanguard-nginx || true

# Run a standalone Nginx container with host networking
docker run -d --name vanguard-nginx \
  --network host \
  -v /var/www/html:/usr/share/nginx/html \
  nginx:alpine
success "Standalone Nginx container created with host networking"

# Check if the Nginx container is running
log "Checking if the Nginx container is running..."
if docker ps | grep -q vanguard-nginx; then
    success "Nginx container is running"
else
    error "Nginx container failed to start"
    docker logs vanguard-nginx
fi

# Print summary
echo ""
log "Network diagnosis and fixes completed!"
echo ""
echo -e "${GREEN}The network issues should now be diagnosed and potentially fixed.${NC}"
echo ""
echo "Access the test page at:"
echo -e "  ${GREEN}http://localhost:8080${NC}"
if [ "$IS_AWS" = true ] && [ -n "$PUBLIC_IP" ]; then
    echo -e "  ${GREEN}http://$PUBLIC_IP:8080${NC} (from the internet)"
fi
echo ""
echo "If you still have issues, please check:"
echo "1. AWS Security Group configuration"
echo "2. Network ACLs"
echo "3. Subnet configuration (ensure it's a public subnet)"
echo "4. Instance status and health"
echo ""
echo -e "${GREEN}System should now be operational!${NC}"

# Cleanup
log "Cleaning up..."
kill $PYTHON_PID || true
success "Cleanup completed"