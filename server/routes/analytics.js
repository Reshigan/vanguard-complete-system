const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const manufacturerAnalytics = require('../controllers/manufacturerAnalyticsController');
const aiChatService = require('../services/ai/chatService');
const anomalyDetection = require('../services/ml/anomalyDetection');

// Manufacturer Analytics Routes
router.get('/manufacturer/dashboard', auth, async (req, res) => {
  // Check if user has manufacturer access
  if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  await manufacturerAnalytics.getDashboard(req, res);
});

router.get('/manufacturer/channels', auth, async (req, res) => {
  if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  const manufacturerId = req.user.manufacturer_id || req.query.manufacturer_id;
  const { startDate, endDate } = manufacturerAnalytics.getDateRange(req.query.timeframe || '30days');
  
  const analysis = await manufacturerAnalytics.getChannelAnalysis(manufacturerId, startDate, endDate);
  res.json({ success: true, data: analysis });
});

router.get('/manufacturer/complaints', auth, async (req, res) => {
  if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  const manufacturerId = req.user.manufacturer_id || req.query.manufacturer_id;
  const { startDate, endDate } = manufacturerAnalytics.getDateRange(req.query.timeframe || '30days');
  
  const analysis = await manufacturerAnalytics.getComplaintsAnalysis(manufacturerId, startDate, endDate);
  res.json({ success: true, data: analysis });
});

router.get('/manufacturer/supply-chain', auth, async (req, res) => {
  if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  const manufacturerId = req.user.manufacturer_id || req.query.manufacturer_id;
  const { startDate, endDate } = manufacturerAnalytics.getDateRange(req.query.timeframe || '30days');
  
  const metrics = await manufacturerAnalytics.getSupplyChainMetrics(manufacturerId, startDate, endDate);
  res.json({ success: true, data: metrics });
});

router.get('/manufacturer/predictions', auth, async (req, res) => {
  if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  const manufacturerId = req.user.manufacturer_id || req.query.manufacturer_id;
  const predictions = await manufacturerAnalytics.getPredictiveInsights(manufacturerId);
  res.json({ success: true, data: predictions });
});

// AI Chat Routes
router.post('/ai/chat/start', auth, async (req, res) => {
  try {
    const { sessionType = 'support' } = req.body;
    const result = await aiChatService.startSession(req.user.id, sessionType);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/chat/message', auth, async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: 'Session ID and message required' });
    }
    
    const result = await aiChatService.processMessage(sessionId, message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/chat/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }
    
    const summary = await aiChatService.endSession(sessionId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ML Anomaly Detection Routes
router.post('/ml/analyze-user', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const targetUserId = userId || req.user.id;
    const analysis = await anomalyDetection.analyzeUserBehavior(targetUserId);
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ml/analyze-channel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const { channelId } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ success: false, error: 'Channel ID required' });
    }
    
    const analysis = await anomalyDetection.analyzeChannel(channelId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ml/suspicious-patterns', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const { limit = 50, patternType, minRiskScore = 0.5 } = req.query;
    
    const knex = require('../config/database');
    let query = knex('suspicious_patterns')
      .where('risk_score', '>=', minRiskScore)
      .orderBy('detected_at', 'desc')
      .limit(limit);
    
    if (patternType) {
      query = query.where('pattern_type', patternType);
    }
    
    const patterns = await query;
    
    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Heat Map Data Route
router.get('/heatmap/counterfeits', auth, async (req, res) => {
  try {
    const { timeframe = '30days', zoom = 'country' } = req.query;
    const knex = require('../config/database');
    
    const { startDate, endDate } = manufacturerAnalytics.getDateRange(timeframe);
    
    let query;
    
    if (zoom === 'country') {
      query = knex('counterfeit_reports as cr')
        .join('distribution_channels as dc', knex.raw('ST_DWithin(cr.location::geography, dc.location::geography, 10000)'))
        .whereBetween('cr.created_at', [startDate, endDate])
        .select('dc.country')
        .count('* as count')
        .groupBy('dc.country')
        .orderBy('count', 'desc');
    } else {
      // City-level or coordinate-level data
      query = knex('counterfeit_reports')
        .whereBetween('created_at', [startDate, endDate])
        .whereNotNull('location')
        .select(
          knex.raw('ST_Y(location::geometry) as latitude'),
          knex.raw('ST_X(location::geometry) as longitude'),
          knex.raw('COUNT(*) as intensity')
        )
        .groupBy(knex.raw('ST_SnapToGrid(location::geometry, 0.1)'))
        .having(knex.raw('COUNT(*) > 0'));
    }
    
    const heatmapData = await query;
    
    res.json({ success: true, data: heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time Analytics Stream (WebSocket endpoint info)
router.get('/stream/info', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      websocket_url: process.env.WS_URL || 'ws://localhost:3001/analytics',
      channels: [
        'validations',
        'counterfeits',
        'alerts',
        'supply_chain'
      ],
      authentication: 'Include JWT token in connection query params'
    }
  });
});

module.exports = router;