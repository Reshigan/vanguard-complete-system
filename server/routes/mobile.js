const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const mlService = require('../services/mlService');
const aiChatService = require('../services/aiChatService');
const rewardsService = require('../services/rewardsService');
const blockchainService = require('../services/blockchainService');
const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Mobile app product verification
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { tokenHash, location, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!tokenHash) {
      return res.status(400).json({ error: 'Token hash is required' });
    }

    // Find token in database
    const token = await knex('nfc_tokens')
      .where('token_hash', tokenHash)
      .first();

    if (!token) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Product not found. This may be a counterfeit item.',
        recommendation: 'Report this suspicious product'
      });
    }

    // Get product and manufacturer details
    const product = await knex('products').where('id', token.product_id).first();
    const manufacturer = await knex('manufacturers').where('id', token.manufacturer_id).first();

    // Run ML fraud detection
    const fraudCheck = await mlService.predictFraud(token.id, { userId, location, deviceInfo });

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyProduct(tokenHash);

    // Record verification event
    const eventId = uuidv4();
    await knex('supply_chain_events').insert({
      id: eventId,
      token_id: token.id,
      event_type: 'validation',
      stakeholder_id: userId,
      stakeholder_type: 'consumer',
      location: location ? knex.raw(`POINT(${location.longitude}, ${location.latitude})`) : null,
      metadata: JSON.stringify({
        deviceInfo,
        appVersion: req.headers['app-version'],
        fraudScore: fraudCheck.confidence,
        blockchainVerified: blockchainVerification.verified
      }),
      timestamp: new Date()
    });

    // Award verification points
    if (!fraudCheck.isCounterfeit) {
      await rewardsService.processVerificationReward(userId, eventId);
    }

    // Update token status
    await knex('nfc_tokens')
      .where('id', token.id)
      .update({
        status: fraudCheck.isCounterfeit ? 'reported' : 'validated',
        validated_at: new Date(),
        validated_location: location ? knex.raw(`POINT(${location.longitude}, ${location.latitude})`) : null
      });

    const response = {
      success: true,
      verified: !fraudCheck.isCounterfeit,
      product: {
        name: product.name,
        category: product.category,
        description: product.description,
        alcoholContent: product.alcohol_content,
        volume: product.volume
      },
      manufacturer: {
        name: manufacturer.name,
        country: manufacturer.country
      },
      token: {
        batchNumber: token.batch_number,
        productionDate: token.production_date,
        expiryDate: token.expiry_date,
        status: token.status
      },
      verification: {
        timestamp: new Date(),
        fraudScore: fraudCheck.confidence,
        blockchainVerified: blockchainVerification.verified,
        authenticityScore: (1 - fraudCheck.confidence) * 100
      }
    };

    if (fraudCheck.isCounterfeit) {
      response.warning = {
        message: 'WARNING: This product shows signs of being counterfeit!',
        confidence: `${(fraudCheck.confidence * 100).toFixed(1)}%`,
        recommendation: 'Do not consume. Report immediately for rewards.',
        reportAction: 'report_counterfeit'
      };
    } else {
      response.success_message = 'Product verified as authentic!';
      response.pointsEarned = rewardsService.pointsConfig.productVerification;
    }

    res.json(response);
  } catch (error) {
    console.error('Mobile verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Mobile QR/NFC scan endpoint
router.post('/scan', authenticate, async (req, res) => {
  try {
    const { scanData, scanType, location, deviceInfo } = req.body;
    
    let tokenHash = scanData;
    
    // Handle different scan types
    if (scanType === 'qr') {
      // Extract token hash from QR code data
      const qrMatch = scanData.match(/token=([a-f0-9]+)/i);
      if (qrMatch) {
        tokenHash = qrMatch[1];
      }
    } else if (scanType === 'nfc') {
      // NFC data might be in different format
      tokenHash = scanData.replace(/[^a-f0-9]/gi, '');
    }

    if (!tokenHash || tokenHash.length < 32) {
      return res.status(400).json({
        error: 'Invalid scan data',
        message: 'Please ensure you are scanning a valid product authentication code'
      });
    }

    // Forward to verification endpoint
    req.body = { tokenHash, location, deviceInfo };
    return router.handle(req, res, () => {});
  } catch (error) {
    console.error('Mobile scan error:', error);
    res.status(500).json({ error: 'Scan processing failed' });
  }
});

// Report counterfeit product
router.post('/report', authenticate, async (req, res) => {
  try {
    const { tokenHash, location, photos, description, additionalInfo } = req.body;
    const userId = req.user.id;

    // Find token if provided
    let tokenId = null;
    if (tokenHash) {
      const token = await knex('nfc_tokens').where('token_hash', tokenHash).first();
      tokenId = token ? token.id : null;
    }

    // Create counterfeit report
    const reportId = uuidv4();
    await knex('counterfeit_reports').insert({
      id: reportId,
      token_id: tokenId,
      reporter_id: userId,
      location: location ? knex.raw(`POINT(${location.longitude}, ${location.latitude})`) : null,
      photos: JSON.stringify(photos || []),
      description: description || 'Reported via mobile app',
      status: 'pending',
      metadata: JSON.stringify({
        reportSource: 'mobile_app',
        deviceInfo: req.body.deviceInfo,
        additionalInfo: additionalInfo
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Award initial reporting points
    await rewardsService.processReportReward(userId, reportId, 'submitted');

    // Update token status if found
    if (tokenId) {
      await knex('nfc_tokens')
        .where('id', tokenId)
        .update({ status: 'reported' });
    }

    res.json({
      success: true,
      reportId: reportId,
      message: 'Thank you for reporting this suspicious product!',
      pointsEarned: rewardsService.pointsConfig.counterfeitReportSubmitted,
      nextSteps: [
        'Your report is being investigated',
        'You may earn additional rewards if confirmed',
        'Check your rewards balance for updates'
      ]
    });
  } catch (error) {
    console.error('Mobile report error:', error);
    res.status(500).json({ error: 'Report submission failed' });
  }
});

// Get user rewards and balance
router.get('/rewards', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await knex('users').where('id', userId).first();
    const rewardsHistory = await rewardsService.getUserRewardsHistory(userId, 10);
    const availableRewards = await rewardsService.getAvailableRewards(userId);

    res.json({
      balance: user.rewards_balance,
      recentTransactions: rewardsHistory.transactions,
      availableRewards: availableRewards.availableRewards.slice(0, 5),
      stats: rewardsHistory.stats,
      achievements: await getAchievements(userId)
    });
  } catch (error) {
    console.error('Mobile rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Redeem reward
router.post('/rewards/redeem', authenticate, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;

    const redemption = await rewardsService.redeemReward(userId, rewardId);

    res.json({
      success: true,
      redemption: {
        code: redemption.redemptionCode,
        newBalance: redemption.newBalance
      },
      message: 'Reward redeemed successfully!',
      instructions: 'Use the redemption code at participating partners'
    });
  } catch (error) {
    console.error('Mobile redemption error:', error);
    res.status(400).json({ error: error.message });
  }
});

// AI Chat endpoint
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    const response = await aiChatService.processMessage(userId, message, sessionId);

    res.json({
      success: true,
      sessionId: response.sessionId,
      message: response.response,
      intent: response.intent,
      actions: response.actions,
      relatedData: response.relatedData
    });
  } catch (error) {
    console.error('Mobile chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Get product history/tracking
router.get('/track/:tokenHash', authenticate, async (req, res) => {
  try {
    const { tokenHash } = req.params;

    const token = await knex('nfc_tokens').where('token_hash', tokenHash).first();
    if (!token) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const events = await knex('supply_chain_events')
      .where('token_id', token.id)
      .orderBy('timestamp', 'asc')
      .select('event_type', 'stakeholder_type', 'timestamp', 'metadata');

    const product = await knex('products').where('id', token.product_id).first();
    const manufacturer = await knex('manufacturers').where('id', token.manufacturer_id).first();

    res.json({
      success: true,
      product: {
        name: product.name,
        category: product.category,
        manufacturer: manufacturer.name
      },
      token: {
        batchNumber: token.batch_number,
        productionDate: token.production_date,
        status: token.status
      },
      supplyChain: events.map(event => ({
        event: event.event_type.replace('_', ' ').toUpperCase(),
        actor: event.stakeholder_type,
        timestamp: event.timestamp,
        details: event.metadata ? JSON.parse(event.metadata) : {}
      }))
    });
  } catch (error) {
    console.error('Mobile tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// Get nearby counterfeit alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // Get recent counterfeit reports in area
    const alerts = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .join('products as p', 'nt.product_id', 'p.id')
      .where('cr.status', 'confirmed')
      .where('cr.created_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
      .whereRaw(
        `ST_Distance_Sphere(cr.location, POINT(?, ?)) <= ? * 1000`,
        [longitude, latitude, radius]
      )
      .select(
        'p.name as product_name',
        'p.category',
        'cr.created_at',
        knex.raw('ST_X(cr.location) as longitude'),
        knex.raw('ST_Y(cr.location) as latitude')
      )
      .limit(10);

    // Get fraud hotspots
    const hotspots = await mlService.getFraudHotspots();

    res.json({
      success: true,
      nearbyAlerts: alerts,
      hotspots: hotspots.slice(0, 5),
      riskLevel: alerts.length > 5 ? 'High' : alerts.length > 2 ? 'Medium' : 'Low',
      message: alerts.length > 0 
        ? `${alerts.length} counterfeit incidents reported in your area recently`
        : 'No recent counterfeit reports in your area'
    });
  } catch (error) {
    console.error('Mobile alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get user profile and statistics
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await knex('users').where('id', userId).first();
    
    const stats = await knex.raw(`
      SELECT 
        COUNT(DISTINCT sce.id) as total_verifications,
        COUNT(DISTINCT cr.id) as total_reports,
        COUNT(DISTINCT CASE WHEN cr.status = 'confirmed' THEN cr.id END) as confirmed_reports,
        COUNT(DISTINCT rt.id) as total_transactions
      FROM users u
      LEFT JOIN supply_chain_events sce ON u.id = sce.stakeholder_id AND sce.event_type = 'validation'
      LEFT JOIN counterfeit_reports cr ON u.id = cr.reporter_id
      LEFT JOIN rewards_transactions rt ON u.id = rt.user_id
      WHERE u.id = ?
    `, [userId]);

    const achievements = await getAchievements(userId);

    res.json({
      success: true,
      profile: {
        email: user.email,
        phone: user.phone,
        role: user.role,
        memberSince: user.created_at,
        rewardsBalance: user.rewards_balance,
        ...JSON.parse(user.profile || '{}')
      },
      statistics: stats[0][0],
      achievements: achievements,
      level: calculateUserLevel(stats[0][0])
    });
  } catch (error) {
    console.error('Mobile profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Helper function to get user achievements
async function getAchievements(userId) {
  const achievements = [];

  // Verification achievements
  const verifications = await knex('supply_chain_events')
    .where('stakeholder_id', userId)
    .where('event_type', 'validation')
    .count('* as count')
    .first();

  if (verifications.count >= 1) achievements.push({ name: 'First Verification', icon: '🔍' });
  if (verifications.count >= 10) achievements.push({ name: 'Verification Expert', icon: '🏆' });
  if (verifications.count >= 100) achievements.push({ name: 'Authentication Master', icon: '👑' });

  // Reporting achievements
  const reports = await knex('counterfeit_reports')
    .where('reporter_id', userId)
    .where('status', 'confirmed')
    .count('* as count')
    .first();

  if (reports.count >= 1) achievements.push({ name: 'Counterfeit Hunter', icon: '🎯' });
  if (reports.count >= 5) achievements.push({ name: 'Brand Protector', icon: '🛡️' });

  return achievements;
}

// Helper function to calculate user level
function calculateUserLevel(stats) {
  const totalActivity = stats.total_verifications + (stats.confirmed_reports * 5);
  
  if (totalActivity >= 100) return { level: 5, name: 'Guardian', icon: '👑' };
  if (totalActivity >= 50) return { level: 4, name: 'Expert', icon: '🏆' };
  if (totalActivity >= 20) return { level: 3, name: 'Defender', icon: '🛡️' };
  if (totalActivity >= 5) return { level: 2, name: 'Scout', icon: '🔍' };
  return { level: 1, name: 'Rookie', icon: '🌟' };
}

module.exports = router;