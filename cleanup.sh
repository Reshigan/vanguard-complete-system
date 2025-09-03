#!/bin/bash

# Vanguard Anti-Counterfeiting System - Cleanup Script
# This script cleans up all Docker containers and temporary files

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
║                CLEANUP SCRIPT                                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)"
    exit 1
fi

# Stop and remove all Docker containers
log "Stopping and removing all Docker containers..."
docker stop $(docker ps -a -q) 2>/dev/null || true
docker rm $(docker ps -a -q) 2>/dev/null || true
success "All Docker containers stopped and removed"

# Remove all Docker networks
log "Removing all Docker networks..."
docker network prune -f
success "All Docker networks removed"

# Remove all Docker volumes
log "Removing all Docker volumes..."
docker volume prune -f
success "All Docker volumes removed"

# Remove all Docker images
log "Removing all Docker images..."
docker rmi $(docker images -q) 2>/dev/null || true
success "All Docker images removed"

# Remove temporary files
log "Removing temporary files..."
rm -rf /tmp/nginx-html
rm -rf /var/www/html/index.html
success "Temporary files removed"

# Remove all fix scripts
log "Removing all fix scripts..."
rm -f fix-*.sh
success "Fix scripts removed"

# Print summary
echo ""
log "Cleanup completed!"
echo ""
echo -e "${GREEN}All Docker containers, networks, volumes, and images have been removed.${NC}"
echo -e "${GREEN}All temporary files and fix scripts have been removed.${NC}"
echo ""
echo "You can now install and run VSCode."
echo ""
echo "To install VSCode on Ubuntu:"
echo "1. Download the .deb package from https://code.visualstudio.com/download"
echo "2. Install it with: sudo apt install ./vscode.deb"
echo ""
echo "To install VSCode on Amazon Linux:"
echo "1. sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc"
echo "2. sudo sh -c 'echo -e \"[code]\\nname=Visual Studio Code\\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\\nenabled=1\\ngpgcheck=1\\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc\" > /etc/yum.repos.d/vscode.repo'"
echo "3. sudo yum install code"
echo ""
echo -e "${GREEN}System is now clean and ready for VSCode installation!${NC}"