const db = require('../config/mockDatabase');

const rewardsController = {
  // Get user rewards
  async getUserRewards(req, res) {
    try {
      const userId = req.user.id;

      // Get user's total points
      const userPoints = await db('users')
        .select('reward_points')
        .where('id', userId)
        .first();

      // Get recent reward transactions
      const transactions = await db('reward_transactions')
        .select('*')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(20);

      // Get available rewards
      const availableRewards = [
        {
          id: 1,
          title: '10% Discount Coupon',
          description: 'Get 10% off your next purchase',
          points_required: 100,
          type: 'discount',
          value: '10%'
        },
        {
          id: 2,
          title: '$5 Gift Card',
          description: 'Redeem for a $5 gift card',
          points_required: 250,
          type: 'gift_card',
          value: '$5'
        },
        {
          id: 3,
          title: 'Premium Membership',
          description: '1 month of premium features',
          points_required: 500,
          type: 'membership',
          value: '1 month'
        }
      ];

      res.json({
        success: true,
        data: {
          current_points: userPoints?.reward_points || 0,
          transactions: transactions || [],
          available_rewards: availableRewards
        }
      });
    } catch (error) {
      console.error('Error getting user rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Redeem reward
  async redeemReward(req, res) {
    try {
      const userId = req.user.id;
      const { reward_id, points_required } = req.body;

      // Get user's current points
      const user = await db('users')
        .select('reward_points')
        .where('id', userId)
        .first();

      if (!user || user.reward_points < points_required) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient points'
        });
      }

      // Deduct points
      await db('users')
        .where('id', userId)
        .update({
          reward_points: user.reward_points - points_required,
          updated_at: new Date()
        });

      // Record transaction
      await db('reward_transactions').insert({
        user_id: userId,
        type: 'redemption',
        points: -points_required,
        description: `Redeemed reward #${reward_id}`,
        created_at: new Date()
      });

      res.json({
        success: true,
        message: 'Reward redeemed successfully',
        data: {
          remaining_points: user.reward_points - points_required
        }
      });
    } catch (error) {
      console.error('Error redeeming reward:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Award points (internal function)
  async awardPoints(userId, points, description) {
    try {
      // Update user points
      await db('users')
        .where('id', userId)
        .increment('reward_points', points)
        .update('updated_at', new Date());

      // Record transaction
      await db('reward_transactions').insert({
        user_id: userId,
        type: 'earned',
        points: points,
        description: description,
        created_at: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  },

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const leaderboard = await db('users')
        .select('email', 'reward_points')
        .where('reward_points', '>', 0)
        .orderBy('reward_points', 'desc')
        .limit(10);

      // Anonymize emails for privacy
      const anonymizedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        email: user.email.substring(0, 3) + '***@' + user.email.split('@')[1],
        points: user.reward_points
      }));

      res.json({
        success: true,
        data: anonymizedLeaderboard
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = rewardsController;