#!/bin/bash

# Vanguard Anti-Counterfeiting System - Quick Install Script
# Usage: curl -sSL https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/install.sh | bash

set -e

echo "======================================"
echo "Vanguard Anti-Counterfeiting System"
echo "Quick Installation Script"
echo "======================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "Error: This script should not be run as root!"
   echo "Please run as a regular user with sudo privileges."
   exit 1
fi

# Prompt for configuration
read -p "Enter your domain name (e.g., vanguard.example.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificates: " SSL_EMAIL
read -p "Generate test data? (y/N): " GENERATE_TEST_DATA

# Export variables for the main setup script
export DOMAIN_NAME
export SSL_EMAIL
export GENERATE_TEST_DATA

# Download and run the main setup script
echo "Downloading setup script..."
curl -sSL https://raw.githubusercontent.com/Reshigan/vanguard-complete-system/main/deploy/aws-setup.sh -o /tmp/vanguard-setup.sh

# Make it executable
chmod +x /tmp/vanguard-setup.sh

# Run the setup
echo "Starting installation..."
/tmp/vanguard-setup.sh

# Clean up
rm -f /tmp/vanguard-setup.sh

echo "Installation complete!"