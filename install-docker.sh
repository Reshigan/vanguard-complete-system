#!/bin/bash

# Vanguard Anti-Counterfeiting System - Docker Installation Script
# This script installs Docker and Docker Compose, then deploys the system

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
║                DOCKER INSTALLATION & DEPLOYMENT                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    log "Detected OS: $OS $VERSION"
else
    error "Unsupported OS. This script requires Ubuntu, Debian, or CentOS"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        # Ubuntu/Debian installation
        apt-get update
        apt-get install -y ca-certificates curl gnupg lsb-release
        
        # Add Docker's official GPG key
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up the repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
    elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
        # CentOS/RHEL/Fedora installation
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
    else
        error "Unsupported OS for Docker installation: $OS"
        exit 1
    fi
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed successfully"
else
    success "Docker is already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log "Installing Docker Compose..."
    
    # Download and install Docker Compose
    DOCKER_COMPOSE_VERSION="2.21.0"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for docker compose command
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
else
    success "Docker Compose is already installed"
fi

# Start Docker daemon if not running
if ! systemctl is-active --quiet docker; then
    log "Starting Docker daemon..."
    systemctl start docker
    sleep 5
    success "Docker daemon started"
fi

# Verify Docker installation
log "Verifying Docker installation..."
if docker --version && (docker-compose --version || docker compose version); then
    success "Docker installation verified"
else
    error "Docker installation verification failed"
    exit 1
fi

# Clone repository if not present
INSTALL_DIR="/opt/vanguard"
if [ ! -d "$INSTALL_DIR" ]; then
    log "Cloning Vanguard repository..."
    git clone https://github.com/Reshigan/vanguard-complete-system.git $INSTALL_DIR
    success "Repository cloned"
else
    log "Updating Vanguard repository..."
    cd $INSTALL_DIR
    git pull
    success "Repository updated"
fi

# Change to installation directory
cd $INSTALL_DIR

# Set proper permissions
chown -R root:root $INSTALL_DIR
chmod +x deploy-docker.sh

# Run the Docker deployment
log "Starting Docker deployment..."
./deploy-docker.sh

success "Installation and deployment completed!"

echo ""
echo -e "${GREEN}Vanguard Anti-Counterfeiting System is now running!${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://localhost${NC}"
echo ""
echo "API is available at:"
echo -e "  ${BLUE}http://localhost:3000/api${NC}"
echo ""
echo "Default admin credentials:"
echo -e "  ${YELLOW}Email: admin@vanguard.local${NC}"
echo -e "  ${YELLOW}Password: Admin@123456${NC}"
echo ""
echo -e "${RED}IMPORTANT: Change the default password after first login!${NC}"
echo ""
echo "To manage the system:"
echo -e "  ${BLUE}View logs: docker-compose -f docker-compose.production.yml logs -f${NC}"
echo -e "  ${BLUE}Stop system: docker-compose -f docker-compose.production.yml down${NC}"
echo -e "  ${BLUE}Restart: docker-compose -f docker-compose.production.yml restart${NC}"
echo ""
echo -e "${GREEN}System is ready for production use!${NC}"