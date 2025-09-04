#!/bin/bash

# 🍎 Vanguard Anti-Counterfeiting System - Mac Setup Script
# This script automates the installation process on macOS

set -e  # Exit on any error

echo "🍎 Vanguard Anti-Counterfeiting System - Mac Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only."
    exit 1
fi

print_info "Starting installation process..."
echo ""

# Step 1: Check and install Homebrew
echo "Step 1: Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    print_status "Homebrew installed successfully"
else
    print_status "Homebrew already installed"
fi

# Step 2: Install Node.js
echo ""
echo "Step 2: Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    brew install node
    print_status "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js already installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js version is too old. Updating to latest version..."
        brew upgrade node
        print_status "Node.js updated successfully"
    fi
fi

# Step 3: Install Git
echo ""
echo "Step 3: Checking Git..."
if ! command -v git &> /dev/null; then
    print_warning "Git not found. Installing Git..."
    brew install git
    print_status "Git installed successfully"
else
    GIT_VERSION=$(git --version)
    print_status "Git already installed: $GIT_VERSION"
fi

# Step 4: Navigate to server directory
echo ""
echo "Step 4: Setting up the project..."
if [ ! -d "server" ]; then
    print_error "Server directory not found. Make sure you're in the project root directory."
    exit 1
fi

cd server
print_status "Navigated to server directory"

# Step 5: Install dependencies
echo ""
echo "Step 5: Installing dependencies..."
print_info "This may take a few minutes..."
npm install
print_status "Dependencies installed successfully"

# Step 6: Set up environment variables
echo ""
echo "Step 6: Setting up environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Environment file created from template"
    else
        print_warning "No .env.example found. Creating basic .env file..."
        cat > .env << EOF
PORT=8080
NODE_ENV=development
DB_CLIENT=sqlite3
DB_FILENAME=./database.sqlite
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
EOF
        print_status "Basic environment file created"
    fi
else
    print_status "Environment file already exists"
fi

# Step 7: Set up database
echo ""
echo "Step 7: Setting up database..."
print_info "Running database migrations..."
npm run migrate
print_status "Database migrations completed"

print_info "Seeding database with sample data..."
npm run seed
print_status "Database seeded with sample data"

# Step 8: Test the installation
echo ""
echo "Step 8: Testing installation..."
print_info "Starting server for testing..."

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s http://localhost:8080/health > /dev/null; then
    print_status "Server is responding correctly"
else
    print_error "Server is not responding. Check the logs above."
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Stop test server
kill $SERVER_PID 2>/dev/null || true
sleep 2

# Final success message
echo ""
echo "🎉 Installation Complete!"
echo "======================="
echo ""
print_status "Vanguard Anti-Counterfeiting System is ready!"
echo ""
echo "To start the system:"
echo "  cd server"
echo "  npm start"
echo ""
echo "Then visit: http://localhost:8080"
echo ""
echo "Features available:"
echo "  🤖 AI/ML fraud detection"
echo "  🎁 Consumer rewards system"
echo "  📊 Manufacturer analytics"
echo "  🔗 Blockchain integration"
echo "  📱 Mobile APIs"
echo "  🚨 Real-time alerts"
echo ""
echo "For detailed documentation, see:"
echo "  📖 README.md - Complete feature overview"
echo "  🚀 DEPLOYMENT.md - Production deployment guide"
echo "  🍎 INSTALL_MAC.md - Detailed Mac installation guide"
echo ""
print_info "Happy coding! 🚀"