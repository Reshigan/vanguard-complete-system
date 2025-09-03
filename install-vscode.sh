#!/bin/bash

# Vanguard Anti-Counterfeiting System - VSCode Installation Script
# This script installs Visual Studio Code

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
║                VSCODE INSTALLATION                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root (sudo)"
    exit 1
fi

# Detect OS
log "Detecting operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
    log "Detected OS: $OS $VERSION"
else
    error "Could not detect operating system"
    exit 1
fi

# Install VSCode based on OS
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    log "Installing VSCode on Ubuntu/Debian..."
    
    # Install dependencies
    apt-get update
    apt-get install -y wget apt-transport-https software-properties-common
    
    # Download and install the Microsoft GPG key
    wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | apt-key add -
    
    # Add the VSCode repository
    add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main"
    
    # Update and install VSCode
    apt-get update
    apt-get install -y code
    
    success "VSCode installed successfully on Ubuntu/Debian"
    
elif [[ "$OS" == *"Amazon Linux"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    log "Installing VSCode on Amazon Linux/CentOS/RHEL..."
    
    # Import the Microsoft GPG key
    rpm --import https://packages.microsoft.com/keys/microsoft.asc
    
    # Add the VSCode repository
    sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
    
    # Update and install VSCode
    yum update -y
    yum install -y code
    
    success "VSCode installed successfully on Amazon Linux/CentOS/RHEL"
    
else
    warning "Unsupported operating system: $OS"
    log "Attempting generic installation method..."
    
    # Try to install using snap if available
    if command -v snap &> /dev/null; then
        log "Installing VSCode using snap..."
        snap install code --classic
        success "VSCode installed successfully using snap"
    else
        error "Could not install VSCode. Please install it manually."
        echo "Visit https://code.visualstudio.com/download to download VSCode for your operating system."
        exit 1
    fi
fi

# Install useful VSCode extensions
log "Installing useful VSCode extensions..."
code --install-extension ms-python.python
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ritwickdey.liveserver
success "VSCode extensions installed"

# Create a desktop shortcut
log "Creating desktop shortcut..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Get the current user
    CURRENT_USER=$(logname || echo $SUDO_USER)
    
    # Create desktop shortcut
    cat > /home/$CURRENT_USER/Desktop/vscode.desktop << EOF
[Desktop Entry]
Name=Visual Studio Code
Comment=Code Editing. Redefined.
GenericName=Text Editor
Exec=/usr/bin/code --no-sandbox --unity-launch %F
Icon=com.visualstudio.code
Type=Application
StartupNotify=false
StartupWMClass=Code
Categories=Utility;TextEditor;Development;IDE;
MimeType=text/plain;inode/directory;application/x-code-workspace;
Actions=new-empty-window;
Keywords=vscode;
EOF
    
    # Set permissions
    chmod +x /home/$CURRENT_USER/Desktop/vscode.desktop
    chown $CURRENT_USER:$CURRENT_USER /home/$CURRENT_USER/Desktop/vscode.desktop
    
    success "Desktop shortcut created"
else
    warning "Desktop shortcut creation not supported on this OS"
fi

# Open the project in VSCode
log "Opening the project in VSCode..."
if [ -d "/workspace/vanguard-complete-system" ]; then
    # Get the current user
    CURRENT_USER=$(logname || echo $SUDO_USER)
    
    # Open VSCode as the current user
    su - $CURRENT_USER -c "code /workspace/vanguard-complete-system"
    
    success "Project opened in VSCode"
else
    warning "Project directory not found. Please open VSCode manually."
fi

# Print summary
echo ""
log "VSCode installation completed!"
echo ""
echo -e "${GREEN}Visual Studio Code has been installed successfully.${NC}"
echo ""
echo "You can now use VSCode to develop the Vanguard Anti-Counterfeiting System."
echo ""
echo "To open VSCode, you can:"
echo "1. Click on the desktop shortcut (if created)"
echo "2. Run 'code' from the terminal"
echo ""
echo -e "${GREEN}Happy coding!${NC}"