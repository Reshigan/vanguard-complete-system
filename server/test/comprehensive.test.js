const request = require('supertest');
const app = require('../index');
const knex = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Vanguard Anti-Counterfeiting System - Comprehensive Tests', () => {
  let authToken;
  let manufacturerToken;
  let testUserId;
  let testManufacturerId;
  let testProductId;
  let testTokenId;

  beforeAll(async () => {
    // Run migrations
    await knex.migrate.latest();
    
    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up
    await knex.destroy();
  });

  async function setupTestData() {
    // Create test manufacturer
    testManufacturerId = uuidv4();
    await knex('manufacturers').insert({
      id: testManufacturerId,
      name: 'Test Manufacturer',
      country: 'USA',
      registration_number: 'TEST-123',
      contact_info: JSON.stringify({ email: 'test@manufacturer.com' })
    });

    // Create test product
    testProductId = uuidv4();
    await knex('products').insert({
      id: testProductId,
      manufacturer_id: testManufacturerId,
      name: 'Test Product',
      category: 'Test Category',
      description: 'Test Description'
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    testUserId = uuidv4();
    await knex('users').insert({
      id: testUserId,
      email: 'test@consumer.com',
      password: hashedPassword,
      role: 'consumer',
      rewards_balance: 1000
    });

    const manufacturerUserId = uuidv4();
    await knex('users').insert({
      id: manufacturerUserId,
      email: 'test@manufacturer.com',
      password: hashedPassword,
      role: 'manufacturer',
      profile: JSON.stringify({ manufacturer_id: testManufacturerId })
    });
  }

  describe('Authentication Tests', () => {
    test('Should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          role: 'consumer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    test('Should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@consumer.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      
      authToken = res.body.data.token;
    });

    test('Should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@consumer.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Token Validation Tests', () => {
    beforeEach(async () => {
      // Create test token
      testTokenId = uuidv4();
      await knex('nfc_tokens').insert({
        id: testTokenId,
        token_hash: `TEST-${Date.now()}`,
        product_id: testProductId,
        manufacturer_id: testManufacturerId,
        batch_number: 'TEST-BATCH-001',
        status: 'active'
      });
    });

    test('Should validate a genuine token', async () => {
      const res = await request(app)
        .post('/api/tokens/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenHash: `TEST-${Date.now()}`,
          location: { latitude: 40.7128, longitude: -74.0060 }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAuthentic).toBe(true);
    });

    test('Should detect counterfeit token', async () => {
      // First validation
      const tokenHash = `TEST-DUPLICATE-${Date.now()}`;
      await knex('nfc_tokens').insert({
        id: uuidv4(),
        token_hash: tokenHash,
        product_id: testProductId,
        manufacturer_id: testManufacturerId,
        batch_number: 'TEST-BATCH-001',
        status: 'validated',
        validated_at: new Date()
      });

      // Second validation attempt
      const res = await request(app)
        .post('/api/tokens/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenHash: tokenHash,
          location: { latitude: 40.7128, longitude: -74.0060 }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isAuthentic).toBe(false);
      expect(res.body.data.reason).toContain('already validated');
    });
  });

  describe('Rewards System Tests', () => {
    test('Should fetch user rewards dashboard', async () => {
      const res = await request(app)
        .get('/api/rewards/v2/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('rewards');
      expect(res.body.data).toHaveProperty('achievements');
    });

    test('Should claim a reward', async () => {
      // Create test reward
      const rewardId = uuidv4();
      await knex('rewards_catalog').insert({
        id: rewardId,
        reward_name: 'Test Reward',
        reward_type: 'gift',
        description: 'Test reward description',
        points_required: 100,
        is_active: true,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const res = await request(app)
        .post('/api/rewards/v2/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rewardId: rewardId,
          deliveryDetails: { method: 'email' }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('claimId');
    });

    test('Should fetch leaderboard', async () => {
      const res = await request(app)
        .get('/api/rewards/v2/leaderboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ timeframe: 'all', category: 'points' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leaderboard');
      expect(res.body.data).toHaveProperty('userRank');
    });
  });

  describe('Analytics Tests', () => {
    beforeAll(async () => {
      // Login as manufacturer
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@manufacturer.com',
          password: 'password123'
        });
      
      manufacturerToken = res.body.data.token;
    });

    test('Should fetch manufacturer dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/manufacturer/dashboard')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .query({ timeframe: '30days' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overview');
      expect(res.body.data).toHaveProperty('channels');
      expect(res.body.data).toHaveProperty('predictions');
    });

    test('Should fetch channel analysis', async () => {
      const res = await request(app)
        .get('/api/analytics/manufacturer/channels')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .query({ timeframe: '30days' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('channels');
      expect(res.body.data).toHaveProperty('geographic');
    });

    test('Should fetch heatmap data', async () => {
      const res = await request(app)
        .get('/api/analytics/heatmap/counterfeits')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ timeframe: '30days', zoom: 'country' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('AI Chat Tests', () => {
    let sessionId;

    test('Should start AI chat session', async () => {
      const res = await request(app)
        .post('/api/analytics/ai/chat/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionType: 'support' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId');
      expect(res.body.data).toHaveProperty('message');
      
      sessionId = res.body.data.sessionId;
    });

    test('Should process chat message', async () => {
      const res = await request(app)
        .post('/api/analytics/ai/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          message: 'How do I report a counterfeit product?'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('response');
    });

    test('Should end chat session', async () => {
      const res = await request(app)
        .post('/api/analytics/ai/chat/end')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionId: sessionId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalMessages');
    });
  });

  describe('ML Anomaly Detection Tests', () => {
    test('Should analyze user behavior', async () => {
      const res = await request(app)
        .post('/api/analytics/ml/analyze-user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUserId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('patterns');
      expect(res.body.data).toHaveProperty('riskScore');
    });

    test('Should fetch suspicious patterns', async () => {
      const res = await request(app)
        .get('/api/analytics/ml/suspicious-patterns')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .query({ limit: 10, minRiskScore: 0.5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Supply Chain Tests', () => {
    test('Should track supply chain event', async () => {
      const res = await request(app)
        .post('/api/supply-chain/track')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          tokenId: testTokenId,
          eventType: 'distribution',
          location: { latitude: 40.7128, longitude: -74.0060 },
          metadata: { distributor: 'Test Distributor' }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Should fetch supply chain history', async () => {
      const res = await request(app)
        .get(`/api/supply-chain/history/${testTokenId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Performance Tests', () => {
    test('Should handle concurrent validations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const promise = request(app)
          .post('/api/tokens/validate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tokenHash: `PERF-TEST-${i}-${Date.now()}`,
            location: { latitude: 40.7128, longitude: -74.0060 }
          });
        
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      
      results.forEach(res => {
        expect(res.statusCode).toBe(200);
      });
    });

    test('API response time should be under 200ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Security Tests', () => {
    test('Should reject requests without authentication', async () => {
      const res = await request(app)
        .get('/api/rewards/v2/dashboard');

      expect(res.statusCode).toBe(401);
    });

    test('Should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/rewards/v2/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });

    test('Should enforce role-based access control', async () => {
      const res = await request(app)
        .get('/api/analytics/manufacturer/dashboard')
        .set('Authorization', `Bearer ${authToken}`); // Consumer token

      expect(res.statusCode).toBe(403);
    });

    test('Should sanitize user input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: '<script>alert("xss")</script>@test.com',
          password: 'password123',
          role: 'consumer'
        });

      expect(res.statusCode).toBe(400);
    });
  });
});