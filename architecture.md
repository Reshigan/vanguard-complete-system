# Vanguard System Architecture

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Consumer App  │    │ Manufacturer    │    │   Distributor   │
│   (Mobile PWA)  │    │   Dashboard     │    │    Portal       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │      API Gateway        │
                    │   (Load Balancer)       │
                    └─────────────┬───────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────────┐ ┌────────┴────────┐ ┌─────────┴───────────┐
│   Authentication    │ │   Core API      │ │   Blockchain        │
│     Service         │ │   Services      │ │   Integration       │
└─────────────────────┘ └─────────────────┘ └─────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │     Database Layer      │
                    │   (PostgreSQL + Redis)  │
                    └─────────────────────────┘
```

## Database Schema

### Core Tables

#### manufacturers
- id (UUID, Primary Key)
- name (VARCHAR)
- country (VARCHAR)
- registration_number (VARCHAR)
- contact_info (JSONB)
- blockchain_address (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### products
- id (UUID, Primary Key)
- manufacturer_id (UUID, Foreign Key)
- name (VARCHAR)
- category (VARCHAR)
- description (TEXT)
- alcohol_content (DECIMAL)
- volume (INTEGER)
- created_at (TIMESTAMP)

#### nfc_tokens
- id (UUID, Primary Key)
- token_hash (VARCHAR, Unique)
- product_id (UUID, Foreign Key)
- manufacturer_id (UUID, Foreign Key)
- batch_number (VARCHAR)
- production_date (DATE)
- expiry_date (DATE)
- blockchain_tx_hash (VARCHAR)
- status (ENUM: 'active', 'validated', 'invalidated', 'reported')
- validated_at (TIMESTAMP)
- validated_location (POINT)
- created_at (TIMESTAMP)

#### supply_chain_events
- id (UUID, Primary Key)
- token_id (UUID, Foreign Key)
- event_type (ENUM: 'production', 'distribution', 'retail', 'validation')
- stakeholder_id (UUID)
- stakeholder_type (ENUM: 'manufacturer', 'distributor', 'retailer', 'consumer')
- location (POINT)
- metadata (JSONB)
- timestamp (TIMESTAMP)

#### counterfeit_reports
- id (UUID, Primary Key)
- token_id (UUID, Foreign Key)
- reporter_id (UUID)
- location (POINT)
- photos (TEXT[])
- description (TEXT)
- status (ENUM: 'pending', 'investigating', 'confirmed', 'false_positive')
- reward_amount (DECIMAL)
- created_at (TIMESTAMP)

#### users
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- phone (VARCHAR)
- role (ENUM: 'consumer', 'manufacturer', 'distributor', 'regulator')
- profile (JSONB)
- rewards_balance (DECIMAL)
- created_at (TIMESTAMP)

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Token Validation
- POST /api/tokens/validate
- POST /api/tokens/invalidate
- GET /api/tokens/:id/history

### Reporting
- POST /api/reports/counterfeit
- GET /api/reports/my-reports
- PUT /api/reports/:id/status

### Supply Chain
- POST /api/supply-chain/events
- GET /api/supply-chain/track/:tokenId
- GET /api/supply-chain/analytics

### Rewards
- GET /api/rewards/balance
- POST /api/rewards/redeem
- GET /api/rewards/history

### Dashboard (Manufacturer/Distributor)
- GET /api/dashboard/analytics
- GET /api/dashboard/products
- GET /api/dashboard/reports
- GET /api/dashboard/supply-chain

## Security Features

### NXT Tag Token Security
- Cryptographic hash generation
- One-time use validation
- Physical destruction detection
- Offline signature verification

### Blockchain Integration
- Immutable token registration
- Smart contract validation
- Multi-signature transactions
- Gas optimization

### Data Protection
- End-to-end encryption
- GDPR compliance
- Data anonymization
- Secure key management

## Scalability Considerations

### Horizontal Scaling
- Microservices architecture
- Container orchestration (Kubernetes)
- Database sharding
- CDN integration

### Performance Optimization
- Redis caching layer
- Database indexing
- API rate limiting
- Image optimization

### Global Deployment
- Multi-region deployment
- Localization support
- Currency conversion
- Regulatory compliance