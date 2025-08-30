#!/bin/bash

echo "🚀 Setting up Vanguard Anti-Counterfeiting System..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Install root dependencies
print_info "Installing root dependencies..."
npm install
print_status "Root dependencies installed"

# Install server dependencies
print_info "Installing server dependencies..."
cd server
npm install
print_status "Server dependencies installed"

# Install client dependencies
print_info "Installing client dependencies..."
cd ../client
npm install
print_status "Client dependencies installed"

cd ..

# Create environment files
print_info "Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    print_status "Created server/.env from template"
    print_warning "Please update server/.env with your database credentials and other settings"
else
    print_info "server/.env already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    cat > client/.env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Vanguard
VITE_APP_VERSION=1.0.0
EOF
    print_status "Created client/.env"
else
    print_info "client/.env already exists"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p server/logs
mkdir -p server/uploads/reports
print_status "Directories created"

# Database setup instructions
print_info "Database setup required:"
echo ""
echo "1. Install PostgreSQL if not already installed"
echo "2. Create a database and user:"
echo "   CREATE DATABASE vanguard_db;"
echo "   CREATE USER vanguard_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE vanguard_db TO vanguard_user;"
echo ""
echo "3. Update server/.env with your database credentials"
echo ""
echo "4. Run database migrations and seed data:"
echo "   cd server && npm run migrate && npm run seed"
echo ""

print_status "Setup completed!"
print_info "Next steps:"
echo ""
echo "1. Configure your database connection in server/.env"
echo "2. Run database migrations: cd server && npm run migrate"
echo "3. Seed test data: cd server && npm run seed"
echo "4. Start the development servers: npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   • Client: http://localhost:54648"
echo "   • Server: http://localhost:3001"
echo "   • API Health: http://localhost:3001/health"
echo ""
print_status "Happy coding! 🎉"