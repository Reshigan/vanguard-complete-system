#!/bin/bash

# Vanguard Anti-Counterfeiting System - Docker Compose Installation
# This script installs Docker Compose and then runs the fix-docker-network.sh script

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
║                DOCKER COMPOSE INSTALLATION                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)"
    exit 1
fi

# Check if Docker is installed
log "Checking if Docker is installed..."
if ! command -v docker &> /dev/null; then
    warning "Docker is not installed. Installing Docker first..."
    
    # Update package index
    apt-get update -y
    
    # Install prerequisites
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Start and enable Docker service
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed successfully"
else
    success "Docker is already installed"
fi

# Install Docker Compose
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    # Get the latest Docker Compose version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
else
    success "Docker Compose is already installed"
fi

# Verify Docker Compose installation
log "Verifying Docker Compose installation..."
docker-compose --version
success "Docker Compose is working"

# Run the fix-docker-network.sh script
log "Running the fix-docker-network.sh script..."
if [ -f "fix-docker-network.sh" ]; then
    chmod +x fix-docker-network.sh
    ./fix-docker-network.sh
else
    warning "fix-docker-network.sh not found in the current directory."
    log "Downloading fix-docker-network.sh..."
    curl -sSL https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/fix-docker-network.sh -o fix-docker-network.sh
    chmod +x fix-docker-network.sh
    ./fix-docker-network.sh
fi

# Print summary
echo ""
log "Installation and fix completed!"
echo ""
echo -e "${GREEN}Docker Compose has been installed and the system has been fixed.${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://localhost:8080${NC}"
echo ""
echo "API is running at:"
echo -e "  ${BLUE}http://localhost:3001/api${NC}"
echo ""
echo -e "${GREEN}System should now be operational!${NC}"