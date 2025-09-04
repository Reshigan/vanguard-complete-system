const request = require('supertest');
const app = require('../server/index');

describe('Verifi API Tests', () => {
  const API_KEY = 'verifi-demo-key-2024';
  
  beforeAll(() => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
  });

  describe('Health Check', () => {
    test('GET /api/verifi/health should return system status', async () => {
      const response = await request(app)
        .get('/api/verifi/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('blockchain');
      expect(response.body.services).toHaveProperty('ai');
    });
  });

  describe('Consumer App APIs', () => {
    describe('Token Validation', () => {
      test('POST /api/verifi/consumer/validate-token should validate authentic token', async () => {
        const tokenData = {
          tokenId: 'VRF-HR001-A1B2C3',
          location: 'Cape Town, South Africa',
          deviceId: 'test-device-123'
        };

        const response = await request(app)
          .post('/api/verifi/consumer/validate-token')
          .set('x-api-key', API_KEY)
          .send(tokenData)
          .expect(200);

        expect(response.body).toHaveProperty('status', 'authentic');
        expect(response.body).toHaveProperty('tokenId', tokenData.tokenId);
        expect(response.body).toHaveProperty('product');
        expect(response.body).toHaveProperty('verification');
        expect(response.body.product).toHaveProperty('name');
        expect(response.body.product).toHaveProperty('brand');
      });

      test('POST /api/verifi/consumer/validate-token should detect counterfeit token', async () => {
        const tokenData = {
          tokenId: 'VRF-HR001-D4E5F6', // This token is marked as consumed
          location: 'Cape Town, South Africa',
          deviceId: 'test-device-123'
        };

        const response = await request(app)
          .post('/api/verifi/consumer/validate-token')
          .set('x-api-key', API_KEY)
          .send(tokenData)
          .expect(200);

        expect(response.body).toHaveProperty('status', 'counterfeit');
        expect(response.body).toHaveProperty('reason');
        expect(response.body).toHaveProperty('suspiciousIndicators');
        expect(Array.isArray(response.body.suspiciousIndicators)).toBe(true);
      });

      test('POST /api/verifi/consumer/validate-token should return invalid for non-existent token', async () => {
        const tokenData = {
          tokenId: 'VRF-INVALID-TOKEN',
          location: 'Cape Town, South Africa',
          deviceId: 'test-device-123'
        };

        const response = await request(app)
          .post('/api/verifi/consumer/validate-token')
          .set('x-api-key', API_KEY)
          .send(tokenData)
          .expect(404);

        expect(response.body).toHaveProperty('status', 'invalid');
        expect(response.body).toHaveProperty('message', 'Token not found');
      });

      test('POST /api/verifi/consumer/validate-token should require API key', async () => {
        const tokenData = {
          tokenId: 'VRF-HR001-A1B2C3',
          location: 'Cape Town, South Africa'
        };

        await request(app)
          .post('/api/verifi/consumer/validate-token')
          .send(tokenData)
          .expect(401);
      });
    });

    describe('User Rewards', () => {
      test('GET /api/verifi/consumer/rewards/:userId should return user rewards data', async () => {
        const userId = 'test-user-123';

        const response = await request(app)
          .get(`/api/verifi/consumer/rewards/${userId}`)
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body).toHaveProperty('userId', userId);
        expect(response.body).toHaveProperty('points');
        expect(response.body).toHaveProperty('tier');
        expect(response.body).toHaveProperty('totalScans');
        expect(response.body).toHaveProperty('counterfeitReports');
        expect(response.body).toHaveProperty('recentActivity');
        expect(Array.isArray(response.body.recentActivity)).toBe(true);
      });
    });

    describe('Counterfeit Reporting', () => {
      test('POST /api/verifi/consumer/report-counterfeit should create counterfeit report', async () => {
        const reportData = {
          tokenId: 'VRF-HR001-D4E5F6',
          userId: 'test-user-123',
          location: 'Cape Town, South Africa',
          description: 'Suspicious packaging and taste',
          photos: ['photo1.jpg', 'photo2.jpg']
        };

        const response = await request(app)
          .post('/api/verifi/consumer/report-counterfeit')
          .set('x-api-key', API_KEY)
          .send(reportData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('reportId');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('bonusPoints', 100);
      });
    });
  });

  describe('Manufacturer App APIs', () => {
    describe('Analytics Dashboard', () => {
      test('GET /api/verifi/manufacturer/analytics/:manufacturerId should return analytics data', async () => {
        const manufacturerId = 'highland-distillery';

        const response = await request(app)
          .get(`/api/verifi/manufacturer/analytics/${manufacturerId}`)
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body).toHaveProperty('overview');
        expect(response.body).toHaveProperty('scanTrends');
        expect(response.body).toHaveProperty('geographicData');
        expect(response.body).toHaveProperty('productPerformance');
        
        expect(response.body.overview).toHaveProperty('totalProducts');
        expect(response.body.overview).toHaveProperty('verifiedToday');
        expect(response.body.overview).toHaveProperty('counterfeitReports');
        expect(response.body.overview).toHaveProperty('authenticityRate');
        
        expect(Array.isArray(response.body.scanTrends)).toBe(true);
        expect(Array.isArray(response.body.geographicData)).toBe(true);
        expect(Array.isArray(response.body.productPerformance)).toBe(true);
      });
    });

    describe('Batch Management', () => {
      test('GET /api/verifi/manufacturer/batches/:manufacturerId should return batches', async () => {
        const manufacturerId = 'highland-distillery';

        const response = await request(app)
          .get(`/api/verifi/manufacturer/batches/${manufacturerId}`)
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const batch = response.body[0];
          expect(batch).toHaveProperty('id');
          expect(batch).toHaveProperty('product');
          expect(batch).toHaveProperty('quantity');
          expect(batch).toHaveProperty('status');
          expect(batch).toHaveProperty('tokensGenerated');
        }
      });

      test('POST /api/verifi/manufacturer/batches should create new batch', async () => {
        const batchData = {
          product: 'Highland Test Whisky',
          quantity: 1000,
          location: 'Test Distillery',
          distributors: ['Test Distributor'],
          manufacturerId: 'highland-distillery'
        };

        const response = await request(app)
          .post('/api/verifi/manufacturer/batches')
          .set('x-api-key', API_KEY)
          .send(batchData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('batch');
        expect(response.body).toHaveProperty('tokensGenerated', 1000);
        expect(response.body.batch).toHaveProperty('id');
        expect(response.body.batch).toHaveProperty('product', batchData.product);
        expect(response.body.batch).toHaveProperty('quantity', batchData.quantity);
      });
    });

    describe('AI Insights', () => {
      test('GET /api/verifi/manufacturer/ai-insights/:manufacturerId should return AI insights', async () => {
        const manufacturerId = 'highland-distillery';

        const response = await request(app)
          .get(`/api/verifi/manufacturer/ai-insights/${manufacturerId}`)
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body).toHaveProperty('anomalies');
        expect(response.body).toHaveProperty('predictions');
        expect(response.body).toHaveProperty('distributorRisk');
        
        expect(Array.isArray(response.body.anomalies)).toBe(true);
        expect(Array.isArray(response.body.predictions)).toBe(true);
        expect(Array.isArray(response.body.distributorRisk)).toBe(true);

        if (response.body.anomalies.length > 0) {
          const anomaly = response.body.anomalies[0];
          expect(anomaly).toHaveProperty('id');
          expect(anomaly).toHaveProperty('type');
          expect(anomaly).toHaveProperty('severity');
          expect(anomaly).toHaveProperty('confidence');
        }
      });
    });
  });

  describe('Association App APIs', () => {
    describe('Industry Analytics', () => {
      test('GET /api/verifi/association/industry-analytics should return industry data', async () => {
        const response = await request(app)
          .get('/api/verifi/association/industry-analytics')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body).toHaveProperty('overview');
        expect(response.body).toHaveProperty('manufacturerPerformance');
        expect(response.body).toHaveProperty('regionalData');
        expect(response.body).toHaveProperty('monthlyTrends');
        
        expect(response.body.overview).toHaveProperty('totalManufacturers');
        expect(response.body.overview).toHaveProperty('totalProducts');
        expect(response.body.overview).toHaveProperty('authenticityRate');
        
        expect(Array.isArray(response.body.manufacturerPerformance)).toBe(true);
        expect(Array.isArray(response.body.regionalData)).toBe(true);
        expect(Array.isArray(response.body.monthlyTrends)).toBe(true);
      });
    });

    describe('Trend Analysis', () => {
      test('GET /api/verifi/association/trend-analysis should return trend data', async () => {
        const response = await request(app)
          .get('/api/verifi/association/trend-analysis')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body).toHaveProperty('crossManufacturerTrends');
        expect(response.body).toHaveProperty('predictiveHotspots');
        expect(response.body).toHaveProperty('networkAnalysis');
        
        expect(Array.isArray(response.body.crossManufacturerTrends)).toBe(true);
        expect(Array.isArray(response.body.predictiveHotspots)).toBe(true);
        expect(response.body.networkAnalysis).toHaveProperty('totalNodes');
        expect(response.body.networkAnalysis).toHaveProperty('totalEdges');
      });
    });

    describe('Investigation Management', () => {
      test('GET /api/verifi/association/investigations should return investigations', async () => {
        const response = await request(app)
          .get('/api/verifi/association/investigations')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const investigation = response.body[0];
          expect(investigation).toHaveProperty('id');
          expect(investigation).toHaveProperty('title');
          expect(investigation).toHaveProperty('priority');
          expect(investigation).toHaveProperty('status');
          expect(investigation).toHaveProperty('assignedTo');
        }
      });

      test('POST /api/verifi/association/investigations should create investigation', async () => {
        const investigationData = {
          title: 'Test Investigation',
          priority: 'medium',
          location: 'Test Location',
          assignedTo: 'Test Officer',
          agency: 'Test Agency',
          description: 'Test investigation description'
        };

        const response = await request(app)
          .post('/api/verifi/association/investigations')
          .set('x-api-key', API_KEY)
          .send(investigationData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('investigation');
        expect(response.body.investigation).toHaveProperty('id');
        expect(response.body.investigation).toHaveProperty('title', investigationData.title);
        expect(response.body.investigation).toHaveProperty('priority', investigationData.priority);
      });
    });
  });

  describe('Blockchain Integration', () => {
    test('POST /api/verifi/blockchain/verify-token should verify token on blockchain', async () => {
      const tokenData = {
        tokenId: 'VRF-HR001-A1B2C3'
      };

      const response = await request(app)
        .post('/api/verifi/blockchain/verify-token')
        .set('x-api-key', API_KEY)
        .send(tokenData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('blockchain');
      expect(response.body.blockchain).toHaveProperty('tokenId', tokenData.tokenId);
      expect(response.body.blockchain).toHaveProperty('blockHash');
      expect(response.body.blockchain).toHaveProperty('verified', true);
      expect(response.body.blockchain).toHaveProperty('immutable', true);
    });
  });

  describe('System Statistics', () => {
    test('GET /api/verifi/stats should return system statistics', async () => {
      const response = await request(app)
        .get('/api/verifi/stats')
        .set('x-api-key', API_KEY)
        .expect(200);

      expect(response.body).toHaveProperty('totalTokens');
      expect(response.body).toHaveProperty('totalBatches');
      expect(response.body).toHaveProperty('totalScans');
      expect(response.body).toHaveProperty('totalInvestigations');
      expect(response.body).toHaveProperty('systemUptime');
      expect(response.body).toHaveProperty('memoryUsage');
      
      expect(typeof response.body.totalTokens).toBe('number');
      expect(typeof response.body.systemUptime).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('Should return 401 for missing API key', async () => {
      await request(app)
        .get('/api/verifi/stats')
        .expect(401);
    });

    test('Should return 401 for invalid API key', async () => {
      await request(app)
        .get('/api/verifi/stats')
        .set('x-api-key', 'invalid-key')
        .expect(401);
    });

    test('Should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/verifi/consumer/validate-token')
        .set('x-api-key', API_KEY)
        .send({}) // Missing tokenId
        .expect(400);
    });
  });

  describe('Performance Tests', () => {
    test('Token validation should respond within 500ms', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/verifi/consumer/validate-token')
        .set('x-api-key', API_KEY)
        .send({
          tokenId: 'VRF-HR001-A1B2C3',
          location: 'Cape Town, South Africa'
        });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('Analytics endpoint should respond within 1000ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/verifi/manufacturer/analytics/highland-distillery')
        .set('x-api-key', API_KEY);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});

describe('Integration Tests', () => {
  const API_KEY = 'verifi-demo-key-2024';

  test('Complete consumer workflow: scan -> validate -> report', async () => {
    // Step 1: Validate a token
    const tokenValidation = await request(app)
      .post('/api/verifi/consumer/validate-token')
      .set('x-api-key', API_KEY)
      .send({
        tokenId: 'VRF-HR001-A1B2C3',
        location: 'Cape Town, South Africa',
        deviceId: 'integration-test-device'
      });

    expect(tokenValidation.status).toBe(200);
    expect(tokenValidation.body.status).toBe('authentic');

    // Step 2: Get user rewards
    const userRewards = await request(app)
      .get('/api/verifi/consumer/rewards/integration-test-user')
      .set('x-api-key', API_KEY);

    expect(userRewards.status).toBe(200);
    expect(userRewards.body).toHaveProperty('points');

    // Step 3: Report a counterfeit (using the consumed token)
    const counterfeitReport = await request(app)
      .post('/api/verifi/consumer/report-counterfeit')
      .set('x-api-key', API_KEY)
      .send({
        tokenId: 'VRF-HR001-D4E5F6',
        userId: 'integration-test-user',
        location: 'Cape Town, South Africa',
        description: 'Integration test counterfeit report'
      });

    expect(counterfeitReport.status).toBe(200);
    expect(counterfeitReport.body.success).toBe(true);
  });

  test('Complete manufacturer workflow: create batch -> view analytics -> get AI insights', async () => {
    // Step 1: Create a new batch
    const batchCreation = await request(app)
      .post('/api/verifi/manufacturer/batches')
      .set('x-api-key', API_KEY)
      .send({
        product: 'Integration Test Whisky',
        quantity: 500,
        location: 'Test Distillery',
        distributors: ['Test Distributor'],
        manufacturerId: 'integration-test-manufacturer'
      });

    expect(batchCreation.status).toBe(200);
    expect(batchCreation.body.success).toBe(true);

    // Step 2: Get analytics data
    const analytics = await request(app)
      .get('/api/verifi/manufacturer/analytics/integration-test-manufacturer')
      .set('x-api-key', API_KEY);

    expect(analytics.status).toBe(200);
    expect(analytics.body).toHaveProperty('overview');

    // Step 3: Get AI insights
    const aiInsights = await request(app)
      .get('/api/verifi/manufacturer/ai-insights/integration-test-manufacturer')
      .set('x-api-key', API_KEY);

    expect(aiInsights.status).toBe(200);
    expect(aiInsights.body).toHaveProperty('anomalies');
  });

  test('Complete association workflow: view industry data -> analyze trends -> create investigation', async () => {
    // Step 1: Get industry analytics
    const industryAnalytics = await request(app)
      .get('/api/verifi/association/industry-analytics')
      .set('x-api-key', API_KEY);

    expect(industryAnalytics.status).toBe(200);
    expect(industryAnalytics.body).toHaveProperty('overview');

    // Step 2: Get trend analysis
    const trendAnalysis = await request(app)
      .get('/api/verifi/association/trend-analysis')
      .set('x-api-key', API_KEY);

    expect(trendAnalysis.status).toBe(200);
    expect(trendAnalysis.body).toHaveProperty('predictiveHotspots');

    // Step 3: Create an investigation
    const investigation = await request(app)
      .post('/api/verifi/association/investigations')
      .set('x-api-key', API_KEY)
      .send({
        title: 'Integration Test Investigation',
        priority: 'high',
        location: 'Test Location',
        assignedTo: 'Integration Test Officer',
        agency: 'Test Agency',
        description: 'Integration test investigation'
      });

    expect(investigation.status).toBe(200);
    expect(investigation.body.success).toBe(true);
  });
});