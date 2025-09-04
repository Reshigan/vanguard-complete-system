# 📚 Verifi AI API Documentation - Level 3 Enterprise

## 🌐 API Overview

The Verifi AI Level 3 API provides comprehensive endpoints for product authentication, user management, analytics, blockchain operations, and enterprise features. All API requests require authentication unless specified otherwise.

### Base URLs

- **Production**: `https://api.verifi-ai.com/v3`
- **Staging**: `https://staging-api.verifi-ai.com/v3`
- **Development**: `http://localhost:3001/api/v3`

### Authentication

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

- **Standard**: 1,000 requests per minute
- **Premium**: 10,000 requests per minute
- **Enterprise**: Unlimited (with fair use policy)

---

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "consumer",
  "organizationId": "org_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "consumer",
      "createdAt": "2024-09-03T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_xyz"
  }
}
```

### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "mfaCode": "123456"
}
```

---

## ✅ Validation Endpoints

### POST /validate
Validate a product by QR code or product ID.

**Request Body:**
```json
{
  "qrCode": "QR-20240901-12345678",
  "productId": "prod_123",
  "location": {
    "latitude": 34.0522,
    "longitude": -118.2437,
    "accuracy": 10
  },
  "metadata": {
    "deviceId": "device_abc",
    "appVersion": "3.0.0",
    "scanMethod": "camera"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validation": {
      "id": "val_789",
      "isAuthentic": true,
      "confidenceScore": 0.98,
      "product": {
        "id": "prod_123",
        "name": "Premium Electronics Device",
        "manufacturer": "TechCorp"
      },
      "mlAnalysis": {
        "models": {
          "counterfeitDetection": 0.99,
          "computerVision": 0.97,
          "behavioralAnalysis": 0.98,
          "supplyChainRisk": 0.95
        },
        "ensemble": 0.98,
        "riskFactors": [],
        "recommendations": []
      },
      "blockchain": {
        "verified": true,
        "transactionHash": "0x9876...5432",
        "timestamp": "2024-09-03T10:15:00Z"
      },
      "rewards": {
        "pointsEarned": 25,
        "achievements": ["First Scan of the Day"],
        "totalPoints": 1250
      },
      "location": {
        "city": "Los Angeles",
        "country": "USA",
        "riskLevel": "low"
      },
      "timestamp": "2024-09-03T10:15:00Z"
    }
  }
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/overview
Get comprehensive analytics overview.

**Query Parameters:**
- `period` (string): 7d, 30d, 90d, 1y, custom
- `startDate` (string): For custom period
- `endDate` (string): For custom period
- `groupBy` (string): day, week, month

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "users": {
        "total": 10000,
        "active": 3500,
        "growth": 15.2,
        "newThisPeriod": 500
      },
      "products": {
        "total": 50000,
        "growth": 8.5,
        "averagePerManufacturer": 100
      },
      "validations": {
        "total": 500000,
        "growth": 25.3,
        "averageConfidence": 0.92,
        "authenticityRate": 95.4
      },
      "counterfeits": {
        "detected": 23000,
        "growth": -5.2,
        "detectionRate": 4.6
      },
      "revenue": {
        "total": 125000,
        "growth": 18.7,
        "averagePerUser": 12.50
      }
    },
    "trends": {
      "7d": {
        "data": [...],
        "summary": {
          "direction": "increasing",
          "strength": 0.85,
          "averageDaily": 1500,
          "volatility": 0.12
        }
      }
    },
    "predictions": {
      "validations": {
        "next30Days": 45000,
        "confidence": 0.89,
        "range": {
          "min": 40000,
          "max": 50000
        }
      }
    },
    "insights": [
      {
        "type": "growth",
        "priority": "high",
        "title": "Rapid User Growth",
        "description": "User base growing at 15.2%",
        "actions": ["Scale infrastructure", "Optimize performance"]
      }
    ]
  }
}
```

---

## 🧪 Testing

### Test Environment
- Base URL: `https://sandbox-api.verifi-ai.com/v3`
- Test API Key: `test_key_abc123`
- Test Products: Use product IDs starting with `test_`

### Example Test Request
```bash
curl -X POST https://sandbox-api.verifi-ai.com/v3/validate \
  -H "Authorization: Bearer test_key_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "test_QR_123456",
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437
    }
  }'
```

---

## 📞 Support

- **Documentation**: https://docs.verifi-ai.com
- **API Status**: https://status.verifi-ai.com
- **Support Email**: api-support@verifi-ai.com
- **Developer Forum**: https://forum.verifi-ai.com
- **GitHub**: https://github.com/verifi-ai/api-examples