const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const enhancedRewards = require('../controllers/enhancedRewardsController');

// Get comprehensive rewards dashboard
router.get('/dashboard', auth, async (req, res) => {
  await enhancedRewards.getRewardsDashboard(req, res);
});

// Claim a reward
router.post('/claim', auth, async (req, res) => {
  await enhancedRewards.claimReward(req, res);
});

// Get leaderboard with filters
router.get('/leaderboard', auth, async (req, res) => {
  await enhancedRewards.getLeaderboard(req, res);
});

// Get gamification progress
router.get('/gamification', auth, async (req, res) => {
  await enhancedRewards.getGamificationProgress(req, res);
});

// Get achievements
router.get('/achievements', auth, async (req, res) => {
  await enhancedRewards.getAchievements(req, res);
});

// Get user's reward history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const knex = require('../config/database');
    
    const history = await knex('user_rewards')
      .join('rewards_catalog', 'user_rewards.reward_id', 'rewards_catalog.id')
      .where('user_rewards.user_id', userId)
      .orderBy('user_rewards.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select(
        'user_rewards.*',
        'rewards_catalog.reward_name',
        'rewards_catalog.reward_type',
        'rewards_catalog.description',
        'rewards_catalog.image_url'
      );
    
    const total = await knex('user_rewards')
      .where('user_id', userId)
      .count('* as count')
      .first();
    
    res.json({
      success: true,
      data: {
        history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(total.count),
          hasMore: offset + limit < total.count
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available rewards catalog
router.get('/catalog', auth, async (req, res) => {
  try {
    const { category, minPoints, maxPoints, sortBy = 'points_required' } = req.query;
    const knex = require('../config/database');
    
    let query = knex('rewards_catalog')
      .where('is_active', true)
      .where('valid_from', '<=', new Date())
      .where('valid_until', '>=', new Date());
    
    if (category) {
      query = query.where('reward_type', category);
    }
    
    if (minPoints) {
      query = query.where('points_required', '>=', minPoints);
    }
    
    if (maxPoints) {
      query = query.where('points_required', '<=', maxPoints);
    }
    
    const rewards = await query.orderBy(sortBy);
    
    // Get user's balance to show affordability
    const user = await knex('users')
      .where('id', req.user.id)
      .select('rewards_balance')
      .first();
    
    const enhancedRewards = rewards.map(reward => ({
      ...reward,
      canAfford: user.rewards_balance >= reward.points_required,
      popularity: Math.floor(Math.random() * 100), // In production, calculate from claims
      estimatedDelivery: reward.reward_type === 'badge' ? 'Instant' : '3-5 business days'
    }));
    
    res.json({
      success: true,
      data: {
        rewards: enhancedRewards,
        userBalance: user.rewards_balance,
        categories: ['gift', 'discount', 'badge', 'experience']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reward details
router.get('/catalog/:rewardId', auth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const knex = require('../config/database');
    
    const reward = await knex('rewards_catalog')
      .where('id', rewardId)
      .where('is_active', true)
      .first();
    
    if (!reward) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    
    // Get claim statistics
    const claimStats = await knex('user_rewards')
      .where('reward_id', rewardId)
      .select(
        knex.raw('COUNT(*) as total_claims'),
        knex.raw('COUNT(CASE WHEN status = \'claimed\' THEN 1 END) as successful_claims'),
        knex.raw('COUNT(DISTINCT user_id) as unique_claimers')
      )
      .first();
    
    // Get user's claim history for this reward
    const userClaims = await knex('user_rewards')
      .where('user_id', req.user.id)
      .where('reward_id', rewardId)
      .orderBy('created_at', 'desc');
    
    res.json({
      success: true,
      data: {
        reward: {
          ...reward,
          statistics: claimStats,
          userClaimHistory: userClaims,
          canClaim: userClaims.filter(c => 
            c.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length < 3 // Max 3 claims per month
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get challenges
router.get('/challenges', auth, async (req, res) => {
  try {
    const challenges = await enhancedRewards.getActiveChallenges(req.user.id);
    
    res.json({
      success: true,
      data: {
        active: challenges.filter(c => !c.completed),
        completed: challenges.filter(c => c.completed),
        upcoming: [] // Could add seasonal/special challenges
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Share achievement (social features)
router.post('/share', auth, async (req, res) => {
  try {
    const { achievementId, platform } = req.body;
    const knex = require('../config/database');
    
    // Get achievement details
    const achievement = await knex('user_achievements')
      .where('id', achievementId)
      .where('user_id', req.user.id)
      .first();
    
    if (!achievement) {
      return res.status(404).json({ success: false, error: 'Achievement not found' });
    }
    
    // Generate shareable content
    const shareContent = {
      title: `I just earned the ${achievement.achievement_level} ${achievement.achievement_type} badge!`,
      description: 'Join me in fighting counterfeits with Vanguard Anti-Counterfeiting System',
      url: `${process.env.APP_URL}/achievements/${achievementId}`,
      image: `${process.env.APP_URL}/images/achievements/${achievement.achievement_type}_${achievement.achievement_level}.png`
    };
    
    // Award social sharing points
    await knex('users')
      .where('id', req.user.id)
      .increment('rewards_balance', 20);
    
    // Track sharing for analytics
    await knex('supply_chain_events').insert({
      id: require('uuid').v4(),
      token_id: null,
      event_type: 'validation', // Reusing for social action
      stakeholder_id: req.user.id,
      stakeholder_type: 'consumer',
      metadata: JSON.stringify({
        action: 'social_share',
        platform,
        achievement_id: achievementId
      }),
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      data: {
        shareContent,
        pointsEarned: 20,
        message: 'Thanks for sharing! You earned 20 bonus points.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get personalized offers
router.get('/offers', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const knex = require('../config/database');
    
    // Get user's validation history
    const validationCount = await knex('supply_chain_events')
      .where('stakeholder_id', userId)
      .where('event_type', 'validation')
      .count('* as count')
      .first();
    
    // Get user's favorite products/categories
    const favoriteProducts = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .where('supply_chain_events.stakeholder_id', userId)
      .select('products.category')
      .groupBy('products.category')
      .count('* as count')
      .orderBy('count', 'desc')
      .limit(3);
    
    // Generate personalized offers
    const offers = [];
    
    if (validationCount.count > 50) {
      offers.push({
        id: 'loyal_customer_bonus',
        title: 'Loyal Customer Bonus',
        description: 'Get 2x points on your next 10 validations',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'multiplier',
        value: 2
      });
    }
    
    if (favoriteProducts.length > 0) {
      offers.push({
        id: 'category_specialist',
        title: `${favoriteProducts[0].category} Specialist Reward`,
        description: `Extra 50 points for validating ${favoriteProducts[0].category} products`,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        type: 'bonus',
        value: 50,
        condition: { category: favoriteProducts[0].category }
      });
    }
    
    // Weekend bonus
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
      offers.push({
        id: 'weekend_warrior',
        title: 'Weekend Warrior Bonus',
        description: '1.5x points this weekend',
        validUntil: new Date(Date.now() + (7 - dayOfWeek) * 24 * 60 * 60 * 1000),
        type: 'multiplier',
        value: 1.5
      });
    }
    
    res.json({
      success: true,
      data: {
        offers,
        userStats: {
          totalValidations: validationCount.count,
          favoriteCategories: favoriteProducts.map(p => p.category)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;