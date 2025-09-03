#!/bin/bash

# Vanguard Anti-Counterfeiting System - Demo Environment
# This script sets up and runs a demo environment for the Vanguard system

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
║                DEMO ENVIRONMENT                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Create necessary directories
mkdir -p demo-frontend

# Stop any existing containers
echo "Stopping any existing containers..."
docker compose -f demo-compose.yaml down 2>/dev/null

# Start the demo environment
echo "Starting the demo environment..."
docker compose -f demo-compose.yaml up -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Demo environment is now running!${NC}"
    echo ""
    echo "You can access the demo at:"
    echo "- Web Interface: http://localhost:8080"
    echo "- API: http://localhost:3001/api"
    echo ""
    echo "To stop the demo, run:"
    echo "docker compose -f demo-compose.yaml down"
    echo ""
    echo "Enjoy exploring the Vanguard Anti-Counterfeiting System!"
else
    echo "Failed to start the demo environment. Please check the logs."
fi