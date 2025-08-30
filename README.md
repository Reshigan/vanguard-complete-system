# Vanguard Anti-Counterfeiting System

A comprehensive NFC-based anti-counterfeiting system with blockchain integration, designed to protect consumers and brands from counterfeit products globally.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd vanguard-system

# Run setup script
chmod +x setup.sh
./setup.sh

# Start development servers
npm run dev
```

## 🌟 Features

### 🔐 Core Security
- **NFC Token Validation**: Unique cryptographic tokens for each product
- **Blockchain Integration**: Immutable record keeping on Ethereum
- **One-Time Physical Validation**: Prevents token reuse through physical destruction
- **Real-time Counterfeit Detection**: Immediate alerts for duplicate validations

### 📱 Consumer Experience
- **Progressive Web App (PWA)**: Works offline, installable on mobile devices
- **Instant NFC Scanning**: Tap-to-verify product authenticity
- **Rewards System**: Earn points for validating products and reporting counterfeits
- **Responsible Drinking**: BAC calculator and safety resources

### 🏭 Business Intelligence
- **Manufacturer Dashboard**: Real-time analytics and supply chain tracking
- **Distributor Portal**: Inventory validation and compliance monitoring
- **Global Scalability**: Multi-language, multi-currency support
- **Regulatory Compliance**: GDPR, CCPA, and international standards

### 🌍 Global Reach
- **8 Test Manufacturers** across different countries
- **30+ Product Categories** including spirits, wine, and premium goods
- **Multi-stakeholder Support**: Consumers, manufacturers, distributors, regulators
- **Comprehensive Test Data**: 1000+ tokens, 100+ users, realistic scenarios

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React PWA     │    │   Node.js API   │    │   PostgreSQL    │
│   (Frontend)    │────│   (Backend)     │────│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Ethereum)    │
                       └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- PWA capabilities
- React Query for state management
- React Router for navigation

**Backend:**
- Node.js with Express
- PostgreSQL with PostGIS
- Redis for caching
- JWT authentication
- Web3.js for blockchain integration

**Infrastructure:**
- Docker containerization
- Kubernetes deployment ready
- CI/CD pipeline support
- Multi-cloud compatibility

## 📊 Demo Scenario: Vanguard Reserve

### The Story
Mark visits a liquor store to buy **Vanguard Reserve**, a limited-edition whisky. The bottle appears authentic with proper labeling and an NFC sticker.

### The Process
1. **Initial Scan**: Mark taps his phone to the NFC sticker
2. **Validation**: System confirms the token is authentic
3. **Physical Validation**: Mark tears the sticker to complete validation
4. **Counterfeit Detection**: System detects the token was already validated
5. **Reporting**: Mark reports the counterfeit location
6. **Investigation**: Manufacturer receives alert and dispatches team

### Test Credentials
```
Consumer: john.smith0@gmail.com | password123
Manufacturer: admin@vanguarddistillery.com | password123
Distributor: distributor0@globaldistributors.com | password123
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Git

### Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure Environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your database credentials
   ```

3. **Database Setup**
   ```bash
   # Create database and user
   createdb vanguard_db
   createuser vanguard_user

   # Run migrations and seed data
   cd server
   npm run migrate
   npm run seed
   ```

4. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   ```

### Available Scripts

```bash
# Root level
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm run test         # Run all tests

# Server
npm run start        # Start production server
npm run dev          # Start development server
npm run migrate      # Run database migrations
npm run seed         # Seed test data
npm run test         # Run backend tests

# Client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run frontend tests
```

## 🌐 API Documentation

### Authentication
```bash
POST /api/auth/register  # User registration
POST /api/auth/login     # User login
POST /api/auth/logout    # User logout
GET  /api/auth/me        # Get user profile
```

### Token Operations
```bash
POST /api/tokens/validate     # Validate NFC token
POST /api/tokens/invalidate   # Invalidate token (tear sticker)
GET  /api/tokens/:hash/info   # Get token information
GET  /api/tokens/my-tokens    # Get user's tokens
```

### Reporting
```bash
POST /api/reports/counterfeit    # Report counterfeit product
GET  /api/reports/my-reports     # Get user's reports
GET  /api/reports/:id           # Get specific report
PUT  /api/reports/:id/status    # Update report status
```

### Dashboard
```bash
GET /api/dashboard/stats        # Get dashboard statistics
GET /api/dashboard/analytics    # Get analytics data
GET /api/dashboard/reports      # Get recent reports
GET /api/dashboard/validations  # Get recent validations
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including Docker, Kubernetes, and cloud deployment options.

## 📈 Performance Metrics

### Target Performance
- **Token Validation**: < 200ms response time
- **Database Queries**: < 50ms average
- **Frontend Load**: < 2s initial load
- **Uptime**: 99.9% availability
- **Scalability**: 10,000+ concurrent users

## 🔒 Security

### Data Protection
- End-to-end encryption
- GDPR compliance
- PCI DSS standards
- SOC 2 Type II certification

### Authentication & Authorization
- JWT with refresh tokens
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- OAuth 2.0 integration

### Blockchain Security
- Private key management with HSM
- Multi-signature wallets
- Gas optimization
- Smart contract auditing

## 🌍 Global Scalability

### Internationalization
- Multi-language support (i18n)
- Right-to-left (RTL) language support
- Currency localization
- Timezone handling

### Compliance
- GDPR (European Union)
- CCPA (California)
- PIPEDA (Canada)
- LGPD (Brazil)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](./docs/api.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Demo Guide](./DEMO.md)
- [Architecture Overview](./docs/architecture.md)

---

**Vanguard** - Protecting authenticity, one product at a time. 🛡️