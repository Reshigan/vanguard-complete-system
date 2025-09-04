const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const aiChatService = require('../services/aiChatService');
const mlService = require('../services/mlService');
const analyticsService = require('../services/analyticsService');

// AI Chat endpoint
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiChatService.processMessage(userId, message, sessionId);

    res.json({
      success: true,
      sessionId: response.sessionId,
      message: response.response,
      intent: response.intent,
      actions: response.actions || [],
      relatedData: response.relatedData || {}
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Get chat insights (admin only)
router.get('/chat/insights', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const insights = await aiChatService.getChatInsights(start, end);

    res.json({
      success: true,
      insights,
      period: { startDate: start, endDate: end }
    });
  } catch (error) {
    console.error('Chat insights error:', error);
    res.status(500).json({ error: 'Failed to fetch chat insights' });
  }
});

// ML fraud prediction
router.post('/ml/predict', authenticate, authorize(['admin', 'manufacturer']), async (req, res) => {
  try {
    const { tokenId, validationData } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const prediction = await mlService.predictFraud(tokenId, validationData || {});

    res.json({
      success: true,
      prediction: {
        isCounterfeit: prediction.isCounterfeit,
        confidence: prediction.confidence,
        riskLevel: prediction.confidence > 0.8 ? 'High' : 
                   prediction.confidence > 0.5 ? 'Medium' : 'Low'
      }
    });
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// Get fraud hotspots
router.get('/ml/hotspots', authenticate, async (req, res) => {
  try {
    const hotspots = await mlService.getFraudHotspots();

    res.json({
      success: true,
      hotspots: hotspots.slice(0, 10),
      totalHotspots: hotspots.length
    });
  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud hotspots' });
  }
});

// Analyze repeat offender
router.post('/ml/analyze-offender', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { identifierType, identifierValue } = req.body;

    if (!identifierType || !identifierValue) {
      return res.status(400).json({ error: 'Identifier type and value are required' });
    }

    const analysis = await mlService.analyzeRepeatOffender(identifierType, identifierValue);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Offender analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Train ML model (admin only)
router.post('/ml/train', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // This is a long-running operation, so we'll start it asynchronously
    mlService.trainModel().then(() => {
      console.log('ML model training completed');
    }).catch(error => {
      console.error('ML model training failed:', error);
    });

    res.json({
      success: true,
      message: 'Model training started. This may take several minutes.',
      status: 'training_started'
    });
  } catch (error) {
    console.error('ML training error:', error);
    res.status(500).json({ error: 'Failed to start training' });
  }
});

// Get manufacturer analytics
router.get('/analytics/manufacturer/:manufacturerId', authenticate, authorize(['admin', 'manufacturer']), async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const { dateRange = 30 } = req.query;

    // Check if user has access to this manufacturer's data
    if (req.user.role === 'manufacturer') {
      const userProfile = JSON.parse(req.user.profile || '{}');
      if (userProfile.manufacturerId !== manufacturerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const analytics = await analyticsService.getManufacturerAnalytics(manufacturerId, parseInt(dateRange));

    res.json({
      success: true,
      analytics,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Manufacturer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get real-time alerts for manufacturer
router.get('/analytics/alerts/:manufacturerId', authenticate, authorize(['admin', 'manufacturer']), async (req, res) => {
  try {
    const { manufacturerId } = req.params;

    // Check access permissions
    if (req.user.role === 'manufacturer') {
      const userProfile = JSON.parse(req.user.profile || '{}');
      if (userProfile.manufacturerId !== manufacturerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const alerts = await analyticsService.getRealTimeAlerts(manufacturerId);

    res.json({
      success: true,
      alerts,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Real-time alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Update channel analytics (system endpoint)
router.post('/analytics/update-channels', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await analyticsService.updateChannelAnalytics();

    res.json({
      success: true,
      message: 'Channel analytics updated successfully'
    });
  } catch (error) {
    console.error('Channel analytics update error:', error);
    res.status(500).json({ error: 'Failed to update channel analytics' });
  }
});

// Get system-wide AI/ML statistics
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const stats = {
      ml: {
        totalPredictions: 0,
        accuracyRate: 0,
        activePatterns: 0
      },
      ai: {
        totalChatSessions: 0,
        resolutionRate: 0,
        popularIntents: []
      },
      analytics: {
        totalManufacturers: 0,
        totalChannels: 0,
        avgTrustScore: 0
      }
    };

    // Get ML stats
    const mlTrainingData = await require('../config/database')('ml_training_data')
      .count('* as total')
      .avg('confidence_score as avg_confidence')
      .first();

    stats.ml.totalPredictions = parseInt(mlTrainingData.total || 0);
    stats.ml.accuracyRate = parseFloat(mlTrainingData.avg_confidence || 0) * 100;

    const activePatterns = await require('../config/database')('fraud_patterns')
      .where('is_active', true)
      .count('* as count')
      .first();

    stats.ml.activePatterns = parseInt(activePatterns.count || 0);

    // Get AI chat stats
    const chatSessions = await require('../config/database')('ai_chat_sessions')
      .count('* as total')
      .first();

    stats.ai.totalChatSessions = parseInt(chatSessions.total || 0);

    // Get analytics stats
    const channelAnalytics = await require('../config/database')('channel_analytics')
      .count('* as total')
      .avg('trust_score as avg_trust')
      .first();

    stats.analytics.totalChannels = parseInt(channelAnalytics.total || 0);
    stats.analytics.avgTrustScore = parseFloat(channelAnalytics.avg_trust || 0);

    const manufacturers = await require('../config/database')('manufacturers')
      .count('* as count')
      .first();

    stats.analytics.totalManufacturers = parseInt(manufacturers.count || 0);

    res.json({
      success: true,
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('AI/ML stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;