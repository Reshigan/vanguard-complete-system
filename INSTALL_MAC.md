# 🍎 Mac Installation Guide - Vanguard Anti-Counterfeiting System

## 🚀 Quick Installation (Recommended)

### Prerequisites Check
First, check if you have the required tools:

```bash
# Check if Homebrew is installed
brew --version

# Check if Node.js is installed
node --version

# Check if Git is installed
git --version
```

### Step 1: Install Prerequisites

#### Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Node.js (Version 18 or higher)
```bash
# Install Node.js via Homebrew
brew install node

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show npm version
```

#### Install Git (if not installed)
```bash
brew install git
```

### Step 2: Clone and Setup the System

```bash
# Clone the repository
git clone https://github.com/Reshigan/vanguard-complete-system.git

# Navigate to the project
cd vanguard-complete-system

# Go to the server directory
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed

# Start the system
npm start
```

🎉 **System should now be running at**: `http://localhost:8080`

## 📋 Detailed Installation Steps

### Step 1: System Requirements

**Minimum Requirements:**
- macOS 10.15 (Catalina) or later
- 4GB RAM
- 2GB free disk space
- Internet connection

**Recommended:**
- macOS 12.0 (Monterey) or later
- 8GB RAM
- 5GB free disk space

### Step 2: Install Development Tools

#### Option A: Using Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (for Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install Node.js and npm
brew install node

# Install Git
brew install git

# Optional: Install PostgreSQL for production use
brew install postgresql@14
```

#### Option B: Manual Installation
1. **Node.js**: Download from [nodejs.org](https://nodejs.org/) (LTS version)
2. **Git**: Download from [git-scm.com](https://git-scm.com/download/mac)

### Step 3: Clone the Repository

```bash
# Create a projects directory (optional)
mkdir ~/Projects
cd ~/Projects

# Clone the repository
git clone https://github.com/Reshigan/vanguard-complete-system.git

# Navigate to the project
cd vanguard-complete-system
```

### Step 4: Server Setup

```bash
# Navigate to server directory
cd server

# Install all dependencies
npm install

# This will install:
# - Express.js (web framework)
# - SQLite3 (database)
# - JWT (authentication)
# - TensorFlow.js (AI/ML)
# - And 50+ other packages
```

### Step 5: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit the environment file
nano .env
# or use your preferred editor:
# code .env    (VS Code)
# vim .env     (Vim)
```

**Edit `.env` file with your settings:**
```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration (SQLite for development)
DB_CLIENT=sqlite3
DB_FILENAME=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Blockchain Configuration (optional)
BLOCKCHAIN_NETWORK=development
PRIVATE_KEY=your-private-key-here

# AI/ML Configuration
ML_MODEL_PATH=./models/fraud_detection.json
ENABLE_ML_TRAINING=false

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 6: Database Setup

```bash
# Run database migrations (creates tables)
npm run migrate

# Seed database with sample data
npm run seed

# This creates:
# - 2 manufacturers (SAB, Distell)
# - 23 users across South Africa
# - 50 NFC tokens
# - 100 supply chain events
# - Sample fraud data for ML training
```

### Step 7: Start the System

```bash
# Start in development mode
npm run dev

# Or start in production mode
npm start
```

**You should see:**
```
🚀 Vanguard Anti-Counterfeiting System Starting...
✅ Database connected successfully
✅ ML Service initialized (mock mode)
✅ AI Chat Service initialized
✅ Blockchain Service initialized
✅ Rewards Service initialized
🌟 Server running on http://localhost:8080
🎯 Environment: development
```

## 🧪 Testing the Installation

### 1. Health Check
```bash
curl http://localhost:8080/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 10.5,
  "environment": "development"
}
```

### 2. Test API Endpoints
```bash
# Test authentication endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@vanguard.com", "password": "admin123"}'

# Test mobile verification (requires auth token)
curl -X GET http://localhost:8080/api/mobile/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Access the System
Open your browser and visit:
- **Health Check**: http://localhost:8080/health
- **API Base**: http://localhost:8080/api/

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "npm install" fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Permission denied" errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Issue: Port 8080 already in use
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change port in .env file
echo "PORT=3000" >> .env
```

#### Issue: Database migration fails
```bash
# Reset database
rm -f database.sqlite
npm run migrate
npm run seed
```

#### Issue: Node.js version too old
```bash
# Update Node.js via Homebrew
brew upgrade node

# Or install specific version
brew install node@18
```

### Performance Optimization

#### For Development
```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Start with auto-restart
nodemon index.js
```

#### For Production
```bash
# Install PM2 process manager
npm install -g pm2

# Start with PM2
pm2 start index.js --name "vanguard-system"

# Monitor
pm2 status
pm2 logs vanguard-system
```

## 🚀 Production Setup (Optional)

### Using PostgreSQL Instead of SQLite

```bash
# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb vanguard_production

# Update .env file
echo "DB_CLIENT=pg" >> .env
echo "DB_CONNECTION_STRING=postgresql://localhost/vanguard_production" >> .env

# Run migrations
npm run migrate
npm run seed
```

### Using Docker (Alternative)

```bash
# Build Docker image
docker build -t vanguard-system .

# Run container
docker run -p 8080:8080 vanguard-system
```

## 📱 Next Steps

### 1. Explore the System
- Visit http://localhost:8080/health to confirm it's running
- Check the sample data in your SQLite database
- Test the API endpoints using curl or Postman

### 2. Development
- The system includes hot-reload for development
- Modify files in `/server` and see changes automatically
- Check logs in the terminal for debugging

### 3. Integration
- Build a mobile app that connects to the APIs
- Integrate with your existing systems
- Customize the sample data for your use case

## 🆘 Support

If you encounter issues:

1. **Check the logs**: Look at the terminal output for error messages
2. **Verify prerequisites**: Ensure Node.js 18+ and npm are installed
3. **Check ports**: Make sure port 8080 is available
4. **Database issues**: Try resetting the database with `rm database.sqlite && npm run migrate && npm run seed`

## 🎉 Success!

You now have the world's first comprehensive anti-counterfeiting system running on your Mac! 

**Features Available:**
- 🤖 AI/ML fraud detection
- 🎁 Consumer rewards system
- 📊 Manufacturer analytics
- 🔗 Blockchain integration
- 📱 Mobile APIs
- 🚨 Real-time alerts

**System URL**: http://localhost:8080

Ready to revolutionize anti-counterfeiting! 🌟