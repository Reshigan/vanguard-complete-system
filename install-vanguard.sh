#!/bin/bash

# Vanguard Anti-Counterfeiting System - Complete Installation Script
# This script installs all dependencies and deploys the system on a fresh Linux instance

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
║                COMPLETE INSTALLATION                             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    log "Detected OS: $OS $VER"
else
    error "Cannot detect OS"
    exit 1
fi

# Update system packages
log "Updating system packages..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt-get update -y
    apt-get upgrade -y
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    yum update -y
elif [[ "$OS" == *"SUSE"* ]]; then
    zypper update -y
else
    warning "Unsupported OS for automatic updates. Please update your system manually."
fi
success "System packages updated"

# Install dependencies
log "Installing dependencies..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        git \
        make \
        g++ \
        python3 \
        python3-pip \
        lsof \
        net-tools
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    yum install -y \
        curl \
        gnupg \
        git \
        make \
        gcc-c++ \
        python3 \
        python3-pip \
        lsof \
        net-tools
elif [[ "$OS" == *"SUSE"* ]]; then
    zypper install -y \
        curl \
        gnupg \
        git \
        make \
        gcc-c++ \
        python3 \
        python3-pip \
        lsof \
        net-tools
else
    warning "Unsupported OS for automatic dependency installation. Please install dependencies manually."
fi
success "Dependencies installed"

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Remove old versions
        apt-get remove -y docker docker-engine docker.io containerd runc || true
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/$ID/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Set up the stable repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
          https://download.docker.com/linux/$ID \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        # Install Docker via repository
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
    elif [[ "$OS" == *"Fedora"* ]]; then
        # Install Docker via repository
        dnf -y install dnf-plugins-core
        dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
        dnf install -y docker-ce docker-ce-cli containerd.io
    elif [[ "$OS" == *"SUSE"* ]]; then
        # Install Docker via repository
        zypper addrepo https://download.docker.com/linux/sles/docker-ce.repo
        zypper install -y docker-ce docker-ce-cli containerd.io
    else
        # Generic installation using convenience script
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    # Start and enable Docker service
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed successfully"
else
    success "Docker is already installed"
fi

# Install Docker Compose
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Install Docker Compose v2 as a plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    
    # Create symlink for backward compatibility
    ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    
    success "Docker Compose installed successfully"
else
    success "Docker Compose is already installed"
fi

# Clone the repository
log "Cloning Vanguard repository..."
REPO_DIR="/opt/vanguard-complete-system"
if [ -d "$REPO_DIR" ]; then
    warning "Repository directory already exists. Updating..."
    cd "$REPO_DIR"
    git pull
else
    git clone https://github.com/Reshigan/vanguard-complete-system.git "$REPO_DIR"
    cd "$REPO_DIR"
fi
success "Repository cloned/updated successfully"

# Set permissions
log "Setting permissions..."
chmod +x "$REPO_DIR/deploy-vanguard.sh"
success "Permissions set"

# Check for port conflicts
log "Checking for port conflicts..."
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

check_port 5433 "PostgreSQL"
check_port 6380 "Redis"
check_port 3001 "Application"
check_port 8080 "Nginx HTTP"
check_port 8443 "Nginx HTTPS"

if [ "$PORT_CONFLICT" = true ]; then
    warning "Port conflicts detected. You may need to modify docker-compose.production.yml to use different ports."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment aborted due to port conflicts."
        exit 1
    fi
fi

# Deploy the system
log "Deploying Vanguard system..."
cd "$REPO_DIR"
./deploy-vanguard.sh

# Create systemd service for auto-start
log "Creating systemd service for auto-start..."
cat > /etc/systemd/system/vanguard.service << EOF
[Unit]
Description=Vanguard Anti-Counterfeiting System
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$REPO_DIR
ExecStart=/usr/local/bin/docker-compose -f $REPO_DIR/docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f $REPO_DIR/docker-compose.production.yml down

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vanguard.service
success "Systemd service created and enabled"

# Create update script
log "Creating update script..."
cat > "$REPO_DIR/update-vanguard.sh" << 'EOF'
#!/bin/bash

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

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Update repository
log "Updating Vanguard repository..."
cd /opt/vanguard-complete-system
git pull
success "Repository updated"

# Restart services
log "Restarting Vanguard services..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
success "Services restarted"

log "Update completed successfully!"
EOF

chmod +x "$REPO_DIR/update-vanguard.sh"
success "Update script created"

# Create backup script
log "Creating backup script..."
cat > "$REPO_DIR/backup-vanguard.sh" << 'EOF'
#!/bin/bash

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

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

# Set backup directory
BACKUP_DIR="/opt/vanguard-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/vanguard_backup_$TIMESTAMP.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
log "Backing up PostgreSQL database..."
docker-compose -f /opt/vanguard-complete-system/docker-compose.production.yml exec -T postgres pg_dump -U vanguard vanguard > "$BACKUP_DIR/vanguard_db_$TIMESTAMP.sql"
success "Database backup created"

# Backup volumes
log "Backing up Docker volumes..."
docker run --rm -v vanguard-complete-system_postgres_data:/postgres_data -v vanguard-complete-system_redis_data:/redis_data -v vanguard-complete-system_app_uploads:/app_uploads -v vanguard-complete-system_app_logs:/app_logs -v vanguard-complete-system_app_data:/app_data -v "$BACKUP_DIR:/backup" alpine tar -czf "/backup/volumes_$TIMESTAMP.tar.gz" /postgres_data /redis_data /app_uploads /app_logs /app_data
success "Volumes backup created"

# Create full backup archive
log "Creating full backup archive..."
tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" "vanguard_db_$TIMESTAMP.sql" "volumes_$TIMESTAMP.tar.gz"
success "Full backup created at $BACKUP_FILE"

# Clean up temporary files
log "Cleaning up temporary files..."
rm "$BACKUP_DIR/vanguard_db_$TIMESTAMP.sql" "$BACKUP_DIR/volumes_$TIMESTAMP.tar.gz"
success "Temporary files removed"

# Keep only the last 5 backups
log "Removing old backups..."
ls -t "$BACKUP_DIR"/vanguard_backup_*.tar.gz | tail -n +6 | xargs rm -f
success "Old backups removed"

log "Backup completed successfully!"
EOF

chmod +x "$REPO_DIR/backup-vanguard.sh"
success "Backup script created"

# Create cron job for daily backups
log "Creating cron job for daily backups..."
(crontab -l 2>/dev/null || echo "") | grep -v "backup-vanguard.sh" | { cat; echo "0 2 * * * /opt/vanguard-complete-system/backup-vanguard.sh > /var/log/vanguard-backup.log 2>&1"; } | crontab -
success "Cron job created for daily backups at 2 AM"

# Print summary
echo ""
log "Installation completed!"
echo ""
echo -e "${GREEN}Vanguard Anti-Counterfeiting System has been successfully installed!${NC}"
echo ""
echo "Access the application at:"
echo -e "  ${GREEN}http://$(hostname -I | awk '{print $1}'):8080${NC}"
echo ""
echo "API is running at:"
echo -e "  ${BLUE}http://$(hostname -I | awk '{print $1}'):3001/api${NC}"
echo ""
echo "Default admin credentials:"
echo -e "  ${YELLOW}Email: admin@vanguard.local${NC}"
echo -e "  ${YELLOW}Password: Admin@123456${NC}"
echo ""
echo -e "${RED}IMPORTANT: Change the default passwords immediately after first login!${NC}"
echo ""
echo "Useful commands:"
echo -e "  ${BLUE}Start system: systemctl start vanguard${NC}"
echo -e "  ${BLUE}Stop system: systemctl stop vanguard${NC}"
echo -e "  ${BLUE}Check status: systemctl status vanguard${NC}"
echo -e "  ${BLUE}Update system: /opt/vanguard-complete-system/update-vanguard.sh${NC}"
echo -e "  ${BLUE}Backup system: /opt/vanguard-complete-system/backup-vanguard.sh${NC}"
echo -e "  ${BLUE}View logs: docker-compose -f /opt/vanguard-complete-system/docker-compose.production.yml logs -f${NC}"
echo ""
echo -e "${GREEN}System is ready for production use!${NC}"
echo -e "${GREEN}Enhanced with ML capabilities and AI-powered analytics for tracking illicit sales and identifying repeat offenders.${NC}"