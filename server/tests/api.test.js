/**
 * Comprehensive API Testing Suite for Vanguard Anti-Counterfeiting System
 * 
 * This test suite verifies all backend functionality including:
 * - Authentication and authorization
 * - Product management
 * - Token verification
 * - User management
 * - Reporting system
 * - Analytics
 * - ML integration
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app');
const db = require('../db');
const redisClient = require('../redis');
const { User, Product, AuthToken, Validation, Report } = require('../models');

// Test data
const testUsers = {
  admin: {
    email: 'admin@vanguard.local',
    password: 'Admin@123456',
    name: 'System Administrator',
    role: 'admin'
  },
  manufacturer: {
    email: 'manufacturer@example.com',
    password: 'password123',
    name: 'Test Manufacturer',
    role: 'manufacturer'
  },
  consumer: {
    email: 'consumer@example.com',
    password: 'password123',
    name: 'Test Consumer',
    role: 'consumer'
  }
};

const testProducts = [
  {
    name: 'Premium Headphones',
    sku: 'SKU-1001',
    description: 'High-quality noise-cancelling headphones',
    category: 'Electronics',
    price: 199.99
  },
  {
    name: 'Smart Watch',
    sku: 'SKU-1002',
    description: 'Fitness and health tracking smartwatch',
    category: 'Wearables',
    price: 249.99
  }
];

// Store tokens for authenticated requests
let tokens = {
  admin: null,
  manufacturer: null,
  consumer: null
};

// Helper function to create authenticated request
const authRequest = (role) => {
  return request(app).set('Authorization', `Bearer ${tokens[role]}`);
};

describe('Vanguard API Tests', function() {
  this.timeout(10000); // Increase timeout for slower operations

  // Setup before all tests
  before(async () => {
    // Connect to test database
    await db.connect();
    
    // Clear database collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await AuthToken.deleteMany({});
    await Validation.deleteMany({});
    await Report.deleteMany({});
    
    // Create test users
    for (const [role, userData] of Object.entries(testUsers)) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        ...userData,
        password: hashedPassword
      });
    }
  });

  // Cleanup after all tests
  after(async () => {
    // Disconnect from database
    await db.disconnect();
    
    // Close Redis connection
    await redisClient.quit();
  });

  // Authentication Tests
  describe('Authentication', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@vanguard.local',
          password: 'wrongpassword'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });

    it('should login admin user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.role).to.equal('admin');
      
      tokens.admin = res.body.token;
    });

    it('should login manufacturer user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.manufacturer.email,
          password: testUsers.manufacturer.password
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      
      tokens.manufacturer = res.body.token;
    });

    it('should login consumer user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.consumer.email,
          password: testUsers.consumer.password
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      
      tokens.consumer = res.body.token;
    });

    it('should get current user profile', async () => {
      const res = await authRequest('admin')
        .get('/api/auth/profile');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('email', testUsers.admin.email);
      expect(res.body).to.have.property('role', 'admin');
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.status).to.equal(401);
    });
  });

  // Product Management Tests
  describe('Product Management', () => {
    let productId;

    it('should create a new product (admin)', async () => {
      const res = await authRequest('admin')
        .post('/api/products')
        .send(testProducts[0]);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('name', testProducts[0].name);
      expect(res.body).to.have.property('sku', testProducts[0].sku);
      
      productId = res.body.id;
    });

    it('should create a new product (manufacturer)', async () => {
      const res = await authRequest('manufacturer')
        .post('/api/products')
        .send(testProducts[1]);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('name', testProducts[1].name);
    });

    it('should reject product creation by consumer', async () => {
      const res = await authRequest('consumer')
        .post('/api/products')
        .send({
          name: 'Unauthorized Product',
          sku: 'SKU-9999'
        });
      
      expect(res.status).to.equal(403);
    });

    it('should get all products', async () => {
      const res = await authRequest('admin')
        .get('/api/products');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2);
    });

    it('should get a specific product', async () => {
      const res = await authRequest('admin')
        .get(`/api/products/${productId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', productId);
      expect(res.body).to.have.property('name', testProducts[0].name);
    });

    it('should update a product', async () => {
      const res = await authRequest('admin')
        .put(`/api/products/${productId}`)
        .send({
          description: 'Updated description'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('description', 'Updated description');
    });
  });

  // Authentication Token Tests
  describe('Authentication Tokens', () => {
    let tokenId;

    it('should generate authentication tokens for a product', async () => {
      // First get a product
      const productRes = await authRequest('admin')
        .get('/api/products');
      
      const productId = productRes.body[0].id;
      
      // Generate tokens
      const res = await authRequest('admin')
        .post('/api/tokens/generate')
        .send({
          productId,
          quantity: 5
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(5);
      
      tokenId = res.body[0].id;
    });

    it('should get all tokens', async () => {
      const res = await authRequest('admin')
        .get('/api/tokens');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(5);
    });

    it('should get a specific token', async () => {
      const res = await authRequest('admin')
        .get(`/api/tokens/${tokenId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', tokenId);
    });

    it('should verify a valid token', async () => {
      // Get a token value first
      const tokenRes = await authRequest('admin')
        .get(`/api/tokens/${tokenId}`);
      
      const tokenValue = tokenRes.body.token;
      
      // Verify the token
      const res = await request(app)
        .post('/api/verify')
        .send({
          token: tokenValue
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('valid', true);
      expect(res.body).to.have.property('product');
    });

    it('should reject an invalid token', async () => {
      const res = await request(app)
        .post('/api/verify')
        .send({
          token: 'INVALID-TOKEN-12345'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('valid', false);
    });
  });

  // User Management Tests
  describe('User Management', () => {
    let userId;

    it('should create a new user (admin)', async () => {
      const res = await authRequest('admin')
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          role: 'consumer'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('email', 'newuser@example.com');
      
      userId = res.body.id;
    });

    it('should get all users (admin)', async () => {
      const res = await authRequest('admin')
        .get('/api/users');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(4); // 3 test users + 1 new user
    });

    it('should reject user listing for non-admin', async () => {
      const res = await authRequest('consumer')
        .get('/api/users');
      
      expect(res.status).to.equal(403);
    });

    it('should get a specific user', async () => {
      const res = await authRequest('admin')
        .get(`/api/users/${userId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', userId);
      expect(res.body).to.have.property('email', 'newuser@example.com');
    });

    it('should update a user', async () => {
      const res = await authRequest('admin')
        .put(`/api/users/${userId}`)
        .send({
          name: 'Updated User Name'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('name', 'Updated User Name');
    });
  });

  // Reporting System Tests
  describe('Reporting System', () => {
    let reportId;

    it('should create a counterfeit report', async () => {
      // First get a token
      const tokensRes = await authRequest('admin')
        .get('/api/tokens');
      
      const tokenId = tokensRes.body[0].id;
      
      // Create report
      const res = await authRequest('consumer')
        .post('/api/reports')
        .send({
          tokenId,
          location: 'Test Location',
          description: 'Suspected counterfeit product',
          evidenceType: 'visual'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('status', 'pending');
      
      reportId = res.body.id;
    });

    it('should get all reports (admin)', async () => {
      const res = await authRequest('admin')
        .get('/api/reports');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
    });

    it('should get consumer\'s own reports', async () => {
      const res = await authRequest('consumer')
        .get('/api/reports/my');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
    });

    it('should update a report status (admin)', async () => {
      const res = await authRequest('admin')
        .put(`/api/reports/${reportId}`)
        .send({
          status: 'confirmed',
          adminNotes: 'Confirmed as counterfeit'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'confirmed');
      expect(res.body).to.have.property('adminNotes', 'Confirmed as counterfeit');
    });
  });

  // Analytics Tests
  describe('Analytics', () => {
    it('should get verification statistics', async () => {
      const res = await authRequest('admin')
        .get('/api/analytics/verifications');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('total');
      expect(res.body).to.have.property('authentic');
      expect(res.body).to.have.property('counterfeit');
    });

    it('should get product statistics', async () => {
      const res = await authRequest('admin')
        .get('/api/analytics/products');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('total');
      expect(res.body).to.have.property('topProducts');
    });

    it('should get user statistics', async () => {
      const res = await authRequest('admin')
        .get('/api/analytics/users');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('total');
      expect(res.body).to.have.property('byRole');
    });

    it('should reject analytics access for consumer', async () => {
      const res = await authRequest('consumer')
        .get('/api/analytics/verifications');
      
      expect(res.status).to.equal(403);
    });
  });

  // ML Integration Tests
  describe('ML Integration', () => {
    it('should get anomaly detection results', async () => {
      const res = await authRequest('admin')
        .get('/api/ml/anomalies');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });

    it('should get pattern analysis', async () => {
      const res = await authRequest('admin')
        .get('/api/ml/patterns');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('patterns');
    });

    it('should trigger model training', async () => {
      const res = await authRequest('admin')
        .post('/api/ml/train');
      
      expect(res.status).to.equal(202);
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('jobId');
    });
  });
});