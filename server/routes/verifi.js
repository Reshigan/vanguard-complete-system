const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Mock database for demo purposes
let verifiDatabase = {
  tokens: new Map(),
  batches: new Map(),
  scans: [],
  users: new Map(),
  investigations: new Map(),
  rewards: new Map()
};

// Initialize with sample data
const initializeSampleData = () => {
  // Sample tokens
  const sampleTokens = [
    {
      id: 'VRF-HR001-A1B2C3',
      batchId: 'HR-2024-001',
      status: 'active',
      product: {
        name: 'Highland Reserve 12yr',
        brand: 'Highland Distillery',
        batch: 'HR-2024-001',
        bottledDate: '2024-01-15',
        location: 'Stellenbosch, South Africa',
        alcohol: '43%',
        volume: '750ml'
      },
      createdAt: new Date('2024-01-15'),
      scannedAt: null,
      scanCount: 0
    },
    {
      id: 'VRF-HR001-D4E5F6',
      batchId: 'HR-2024-001',
      status: 'consumed',
      product: {
        name: 'Highland Reserve 12yr',
        brand: 'Highland Distillery',
        batch: 'HR-2024-001',
        bottledDate: '2024-01-15',
        location: 'Stellenbosch, South Africa',
        alcohol: '43%',
        volume: '750ml'
      },
      createdAt: new Date('2024-01-15'),
      scannedAt: new Date('2024-02-10'),
      scanCount: 3,
      lastScanLocation: 'Lagos, Nigeria'
    }
  ];

  sampleTokens.forEach(token => {
    verifiDatabase.tokens.set(token.id, token);
  });

  // Sample batches
  const sampleBatches = [
    {
      id: 'HR-2024-001',
      product: 'Highland Reserve 12yr',
      manufacturer: 'Highland Distillery',
      quantity: 5000,
      created: '2024-01-15',
      status: 'active',
      tokensGenerated: 5000,
      tokensScanned: 3420,
      authenticity: 98.5,
      location: 'Stellenbosch Distillery',
      distributors: ['Premium Liquors', 'City Distributors']
    }
  ];

  sampleBatches.forEach(batch => {
    verifiDatabase.batches.set(batch.id, batch);
  });
};

initializeSampleData();

// Middleware for API key validation (simplified for demo)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'verifi-demo-key-2024') {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Consumer App APIs

// NFC Token Validation
router.post('/consumer/validate-token', validateApiKey, (req, res) => {
  try {
    const { tokenId, location, deviceId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const token = verifiDatabase.tokens.get(tokenId);

    if (!token) {
      return res.status(404).json({
        status: 'invalid',
        message: 'Token not found',
        tokenId
      });
    }

    // Simulate different validation scenarios
    if (token.status === 'consumed' && token.scanCount > 0) {
      return res.json({
        status: 'counterfeit',
        tokenId,
        reason: 'Token already consumed',
        product: token.product,
        verification: {
          timestamp: new Date().toISOString(),
          location: location || 'Unknown',
          previousScans: token.scanCount,
          lastScanLocation: token.lastScanLocation
        },
        suspiciousIndicators: [
          `Token scanned ${token.scanCount} times previously`,
          `Last scan in ${token.lastScanLocation}`,
          'Unusual geographic pattern detected'
        ]
      });
    }

    // Valid token - mark as consumed
    token.status = 'consumed';
    token.scannedAt = new Date();
    token.scanCount = 1;
    verifiDatabase.tokens.set(tokenId, token);

    // Log the scan
    verifiDatabase.scans.push({
      id: uuidv4(),
      tokenId,
      timestamp: new Date(),
      location: location || 'Unknown',
      deviceId,
      result: 'authentic'
    });

    res.json({
      status: 'authentic',
      tokenId,
      product: token.product,
      verification: {
        timestamp: new Date().toISOString(),
        location: location || 'Unknown',
        previousScans: 0
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Rewards
router.get('/consumer/rewards/:userId', validateApiKey, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock user rewards data
    const userRewards = {
      userId,
      points: 1250,
      tier: 'Silver',
      totalScans: 47,
      counterfeitReports: 2,
      recentActivity: [
        {
          id: 1,
          type: 'scan',
          points: 25,
          description: 'Verified Highland Reserve Whisky',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'report',
          points: 100,
          description: 'Reported counterfeit product',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    res.json(userRewards);
  } catch (error) {
    console.error('Rewards fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report Counterfeit
router.post('/consumer/report-counterfeit', validateApiKey, (req, res) => {
  try {
    const { tokenId, location, description, photos, userId } = req.body;

    const report = {
      id: uuidv4(),
      tokenId,
      userId,
      location,
      description,
      photos: photos || [],
      timestamp: new Date(),
      status: 'pending',
      priority: 'medium'
    };

    // In a real system, this would be stored in a database
    console.log('Counterfeit report created:', report);

    res.json({
      success: true,
      reportId: report.id,
      message: 'Counterfeit report submitted successfully',
      bonusPoints: 100
    });

  } catch (error) {
    console.error('Counterfeit report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manufacturer App APIs

// Analytics Dashboard Data
router.get('/manufacturer/analytics/:manufacturerId', validateApiKey, (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Mock analytics data
    const analyticsData = {
      overview: {
        totalProducts: 125000,
        verifiedToday: 1247,
        counterfeitReports: 23,
        activeDistributors: 45,
        authenticityRate: 98.2
      },
      scanTrends: [
        { date: '2024-02-01', scans: 1200, authentic: 1176, counterfeit: 24 },
        { date: '2024-02-02', scans: 1350, authentic: 1323, counterfeit: 27 },
        { date: '2024-02-03', scans: 1180, authentic: 1156, counterfeit: 24 },
        { date: '2024-02-04', scans: 1420, authentic: 1391, counterfeit: 29 },
        { date: '2024-02-05', scans: 1380, authentic: 1352, counterfeit: 28 },
        { date: '2024-02-06', scans: 1290, authentic: 1264, counterfeit: 26 },
        { date: '2024-02-07', scans: 1247, authentic: 1221, counterfeit: 26 }
      ],
      geographicData: [
        { province: 'Western Cape', scans: 3420, percentage: 28.5 },
        { province: 'Gauteng', scans: 3180, percentage: 26.4 },
        { province: 'KwaZulu-Natal', scans: 2890, percentage: 24.1 },
        { province: 'Eastern Cape', scans: 1560, percentage: 13.0 },
        { province: 'Free State', scans: 980, percentage: 8.0 }
      ],
      productPerformance: [
        { name: 'Highland Reserve 12yr', scans: 3420, authenticity: 98.5, revenue: 125000 },
        { name: 'Highland Single Malt', scans: 2890, authenticity: 99.1, revenue: 98000 },
        { name: 'Highland Blend', scans: 2156, authenticity: 97.8, revenue: 76000 }
      ]
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch Management
router.get('/manufacturer/batches/:manufacturerId', validateApiKey, (req, res) => {
  try {
    const { manufacturerId } = req.params;
    
    const batches = Array.from(verifiDatabase.batches.values());
    res.json(batches);
  } catch (error) {
    console.error('Batches fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manufacturer/batches', validateApiKey, (req, res) => {
  try {
    const { product, quantity, location, distributors, manufacturerId } = req.body;

    const batchId = `${product.substring(0, 2).toUpperCase()}-2024-${String(verifiDatabase.batches.size + 1).padStart(3, '0')}`;
    
    const batch = {
      id: batchId,
      product,
      manufacturer: manufacturerId,
      quantity: parseInt(quantity),
      created: new Date().toISOString().split('T')[0],
      status: 'production',
      tokensGenerated: parseInt(quantity),
      tokensScanned: 0,
      authenticity: 100,
      location,
      distributors: distributors || [],
      alerts: 0
    };

    verifiDatabase.batches.set(batchId, batch);

    // Generate tokens for the batch
    for (let i = 0; i < quantity; i++) {
      const tokenId = `VRF-${batchId}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const token = {
        id: tokenId,
        batchId,
        status: 'active',
        product: {
          name: product,
          brand: manufacturerId,
          batch: batchId,
          bottledDate: batch.created,
          location,
          alcohol: '40%', // Default
          volume: '750ml' // Default
        },
        createdAt: new Date(),
        scannedAt: null,
        scanCount: 0
      };
      verifiDatabase.tokens.set(tokenId, token);
    }

    res.json({
      success: true,
      batch,
      tokensGenerated: quantity,
      message: `Batch ${batchId} created successfully with ${quantity} tokens`
    });

  } catch (error) {
    console.error('Batch creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Insights
router.get('/manufacturer/ai-insights/:manufacturerId', validateApiKey, (req, res) => {
  try {
    const { manufacturerId } = req.params;

    const aiInsights = {
      anomalies: [
        {
          id: 1,
          type: 'geographic',
          severity: 'critical',
          title: 'Unusual Geographic Clustering',
          description: 'Highland Reserve 12yr tokens showing abnormal concentration in Lagos, Nigeria',
          confidence: 94.2,
          affectedTokens: 47,
          recommendation: 'Investigate distributor "Metro Spirits" supply chain immediately',
          timestamp: new Date().toISOString(),
          status: 'active'
        }
      ],
      predictions: [
        {
          metric: 'Counterfeit Risk',
          current: 1.8,
          predicted: 2.3,
          timeframe: '30 days',
          confidence: 89.4,
          trend: 'increasing',
          factors: ['Holiday season approaching', 'New distributor onboarding', 'Price increase announced']
        }
      ],
      distributorRisk: [
        { distributor: 'Premium Liquors', score: 12, risk: 'low' },
        { distributor: 'Metro Spirits', score: 78, risk: 'high' }
      ]
    };

    res.json(aiInsights);
  } catch (error) {
    console.error('AI insights fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Association App APIs

// Industry Analytics
router.get('/association/industry-analytics', validateApiKey, (req, res) => {
  try {
    const industryData = {
      overview: {
        totalManufacturers: 47,
        totalProducts: 2850000,
        totalScansToday: 18420,
        counterfeitReports: 156,
        authenticityRate: 97.8
      },
      manufacturerPerformance: [
        { name: 'Highland Distillery', scans: 125000, authenticity: 98.2, products: 12, risk: 'low' },
        { name: 'Cape Wine Co.', scans: 98000, authenticity: 99.1, products: 18, risk: 'low' },
        { name: 'Johannesburg Spirits', scans: 87000, authenticity: 96.8, products: 8, risk: 'medium' }
      ],
      regionalData: [
        { province: 'Western Cape', scans: 456000, counterfeits: 8200, manufacturers: 12, growth: 18.5 },
        { province: 'Gauteng', scans: 398000, counterfeits: 9800, manufacturers: 15, growth: 12.3 },
        { province: 'KwaZulu-Natal', scans: 287000, counterfeits: 6400, manufacturers: 8, growth: 22.1 }
      ],
      monthlyTrends: [
        { month: 'Jan', scans: 180000, counterfeits: 3200, authenticity: 98.2 },
        { month: 'Feb', scans: 195000, counterfeits: 3800, authenticity: 98.1 },
        { month: 'Mar', scans: 210000, counterfeits: 4200, authenticity: 98.0 }
      ]
    };

    res.json(industryData);
  } catch (error) {
    console.error('Industry analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cross-Manufacturer Trend Analysis
router.get('/association/trend-analysis', validateApiKey, (req, res) => {
  try {
    const trendData = {
      crossManufacturerTrends: [
        { date: '2024-02-01', totalScans: 15420, counterfeitRate: 2.1, networkDensity: 0.73, suspiciousActivity: 12 },
        { date: '2024-02-08', totalScans: 16890, counterfeitRate: 2.3, networkDensity: 0.75, suspiciousActivity: 15 },
        { date: '2024-02-15', totalScans: 18240, counterfeitRate: 2.0, networkDensity: 0.78, suspiciousActivity: 9 }
      ],
      predictiveHotspots: [
        {
          location: 'Lagos, Nigeria',
          riskScore: 94.2,
          predictedIncidents: 23,
          confidence: 89.4,
          factors: ['Geographic clustering', 'Unusual scan patterns', 'Cross-border activity'],
          timeframe: '14 days'
        }
      ],
      networkAnalysis: {
        totalNodes: 247,
        totalEdges: 1834,
        clusters: 12,
        suspiciousSubgraphs: 4
      }
    };

    res.json(trendData);
  } catch (error) {
    console.error('Trend analysis fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Investigation Management
router.get('/association/investigations', validateApiKey, (req, res) => {
  try {
    const investigations = [
      {
        id: 'INV-2024-001',
        title: 'Lagos Counterfeit Network',
        priority: 'critical',
        status: 'active',
        created: '2024-02-01',
        lastUpdate: '2024-02-15',
        assignedTo: 'Detective Sarah Johnson',
        agency: 'SAPS Commercial Crime Unit',
        location: 'Lagos, Nigeria / Johannesburg, SA',
        affectedManufacturers: ['Highland Distillery', 'Cape Wine Co.'],
        estimatedLoss: 2500000,
        evidence: 47,
        suspects: 3,
        description: 'Large-scale counterfeit operation involving multiple SA brands being distributed in West Africa'
      }
    ];

    res.json(investigations);
  } catch (error) {
    console.error('Investigations fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/association/investigations', validateApiKey, (req, res) => {
  try {
    const { title, priority, location, assignedTo, agency, description } = req.body;

    const investigation = {
      id: `INV-2024-${String(verifiDatabase.investigations.size + 1).padStart(3, '0')}`,
      title,
      priority,
      status: 'active',
      created: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      assignedTo,
      agency,
      location,
      description,
      evidence: 0,
      suspects: 0,
      estimatedLoss: 0,
      affectedManufacturers: []
    };

    verifiDatabase.investigations.set(investigation.id, investigation);

    res.json({
      success: true,
      investigation,
      message: `Investigation ${investigation.id} created successfully`
    });

  } catch (error) {
    console.error('Investigation creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blockchain Integration Endpoints
router.post('/blockchain/verify-token', validateApiKey, (req, res) => {
  try {
    const { tokenId } = req.body;
    
    // Simulate blockchain verification
    const blockchainRecord = {
      tokenId,
      blockHash: crypto.createHash('sha256').update(tokenId + Date.now()).digest('hex'),
      timestamp: new Date().toISOString(),
      verified: true,
      immutable: true
    };

    res.json({
      success: true,
      blockchain: blockchainRecord,
      message: 'Token verified on blockchain'
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      blockchain: 'connected',
      ai: 'active'
    }
  });
});

// System Statistics
router.get('/stats', validateApiKey, (req, res) => {
  try {
    const stats = {
      totalTokens: verifiDatabase.tokens.size,
      totalBatches: verifiDatabase.batches.size,
      totalScans: verifiDatabase.scans.length,
      totalInvestigations: verifiDatabase.investigations.size,
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;