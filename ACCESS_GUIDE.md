# 🚀 Vanguard System - Access Guide

## Quick Access Links

### 🌐 Live Demo (After Setup)
- **Frontend**: http://localhost:54648
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### 📱 Mobile App Features
- **Home Page**: Product overview and quick actions
- **Scanner**: NFC token validation interface
- **Reports**: Counterfeit report tracking
- **Rewards**: Point system and redemptions
- **Profile**: User account management
- **Dashboard**: Analytics (for manufacturers/distributors)
- **Responsible Drinking**: BAC calculator and safety resources

## 🛠️ Setup Instructions

### Option 1: Quick Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vanguard-system.git
cd vanguard-system

# Run automated setup
chmod +x setup.sh
./setup.sh

# Start development servers
npm run dev
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Setup environment
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# 3. Setup database (PostgreSQL required)
createdb vanguard_db
createuser vanguard_user

# 4. Run migrations and seed data
cd server
npm run migrate
npm run seed

# 5. Start servers
cd ..
npm run dev
```

## 🔑 Test Accounts

### Consumer Account
- **Email**: john.smith0@gmail.com
- **Password**: password123
- **Features**: Product scanning, counterfeit reporting, rewards

### Manufacturer Account
- **Email**: admin@vanguarddistillery.com
- **Password**: password123
- **Features**: Dashboard analytics, supply chain tracking, report management

### Distributor Account
- **Email**: distributor0@globaldistributors.com
- **Password**: password123
- **Features**: Inventory validation, compliance tracking

## 📊 Demo Scenario: Vanguard Reserve

### Test Token Hash
After running the seed data, check the console output for the Vanguard Reserve test token hash. Use this for testing the counterfeit detection scenario.

### Demo Flow
1. **Login** as consumer (john.smith0@gmail.com)
2. **Navigate** to Scanner page
3. **Enter** the test token hash manually
4. **Observe** the counterfeit detection (token already validated)
5. **Submit** a counterfeit report
6. **Login** as manufacturer to see the report in dashboard

## 🌐 API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "consumer",
    "profile": {
      "name": "Test User",
      "country": "US"
    }
  }'
```

### Token Validation
```bash
curl -X POST http://localhost:3001/api/tokens/validate \
  -H "Content-Type: application/json" \
  -d '{
    "tokenHash": "YOUR_TEST_TOKEN_HASH",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "deviceInfo": {
      "userAgent": "Test Device",
      "platform": "Web"
    }
  }'
```

## 📱 Mobile Features

### NFC Scanner
- **Real NFC**: Works on Android Chrome with NFC-enabled devices
- **Manual Entry**: Fallback for testing without NFC hardware
- **Instant Feedback**: Real-time validation results
- **Counterfeit Detection**: Immediate alerts for duplicate tokens

### Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Core functionality works without internet
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Mobile-first interface design

## 🏭 Business Dashboard

### Manufacturer Features
- **Real-time Analytics**: Token validation statistics
- **Supply Chain Tracking**: Product journey monitoring
- **Counterfeit Management**: Report investigation tools
- **Batch Token Creation**: Bulk token generation
- **Performance Metrics**: KPI tracking and reporting

### Key Metrics Displayed
- Total tokens created and active
- Validation success rates
- Counterfeit detection statistics
- Geographic distribution of reports
- Trend analysis and forecasting

## 🔧 Development Tools

### Available Scripts
```bash
# Development
npm run dev          # Start both frontend and backend
npm run server:dev   # Start backend only
npm run client:dev   # Start frontend only

# Database
npm run migrate      # Run database migrations
npm run seed         # Seed test data
npm run db:reset     # Reset database with fresh data

# Production
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run all tests
npm run test:server  # Run backend tests
npm run test:client  # Run frontend tests
```

### Environment Configuration
```bash
# Server environment (.env)
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vanguard_db
DB_USER=vanguard_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
BLOCKCHAIN_RPC_URL=your_blockchain_url

# Client environment (.env)
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Vanguard
```

## 🚀 Deployment Options

### Local Development
- **Frontend**: Vite dev server on port 54648
- **Backend**: Express server on port 3001
- **Database**: Local PostgreSQL instance

### Docker Deployment
```bash
docker-compose up -d
```

### Cloud Deployment
- **AWS**: ECS Fargate + RDS + ElastiCache
- **GCP**: Cloud Run + Cloud SQL + Memorystore
- **Azure**: Container Instances + Azure Database

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React PWA     │    │   Node.js API   │    │   PostgreSQL    │
│   Port: 54648   │────│   Port: 3001    │────│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Ethereum)    │
                       └─────────────────┘
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:54648 | xargs kill -9
```

#### Database Connection Error
```bash
# Check PostgreSQL status
pg_ctl status
# Start PostgreSQL if needed
pg_ctl start
```

#### NFC Not Working
- Use manual token entry for testing
- NFC requires HTTPS in production
- Only works on Android Chrome currently

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules server/node_modules client/node_modules
npm install
cd server && npm install
cd ../client && npm install
```

## 📞 Support

### Documentation
- **README.md**: Project overview and setup
- **DEPLOYMENT.md**: Production deployment guide
- **DEMO.md**: Complete demo walkthrough
- **SYSTEM_SUMMARY.md**: Technical implementation details

### Getting Help
- Check the troubleshooting section above
- Review the comprehensive documentation
- Test with provided demo accounts
- Use the health check endpoint to verify system status

## 🎯 Next Steps

1. **Setup**: Follow the quick setup instructions
2. **Test**: Use the demo accounts to explore features
3. **Customize**: Modify for your specific use case
4. **Deploy**: Use the deployment guides for production
5. **Scale**: Implement the global scalability features

---

**Ready to protect authenticity worldwide with Vanguard! 🛡️**