const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class RewardsService {
  constructor() {
    this.pointsConfig = {
      productVerification: 10,
      counterfeitReportConfirmed: 500,
      counterfeitReportSubmitted: 50,
      surveyCompletion: 25,
      referralBonus: 100,
      firstTimeBonus: 200,
      monthlyActiveBonus: 50
    };
  }

  // Award points to user
  async awardPoints(userId, type, amount, reason, relatedId = null) {
    const trx = await knex.transaction();
    
    try {
      // Create transaction record
      const transaction = {
        id: uuidv4(),
        user_id: userId,
        type: 'earned',
        amount: amount,
        reason: reason,
        metadata: JSON.stringify({
          awardType: type,
          timestamp: new Date(),
          source: 'system'
        }),
        created_at: new Date(),
        updated_at: new Date()
      };

      if (relatedId) {
        if (type === 'counterfeit_report') {
          transaction.related_report_id = relatedId;
        } else if (type === 'validation') {
          transaction.related_validation_id = relatedId;
        }
      }

      await trx('rewards_transactions').insert(transaction);

      // Update user balance
      await trx('users')
        .where('id', userId)
        .increment('rewards_balance', amount);

      // Check for milestones and bonus rewards
      const newBalance = await trx('users')
        .where('id', userId)
        .select('rewards_balance')
        .first();

      const milestones = await this.checkMilestones(userId, newBalance.rewards_balance, trx);

      await trx.commit();

      return {
        success: true,
        transaction: transaction,
        newBalance: newBalance.rewards_balance,
        milestones: milestones
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Check for milestone achievements
  async checkMilestones(userId, balance, trx) {
    const milestones = [];

    // First 1000 points milestone
    if (balance >= 1000) {
      const existingMilestone = await trx('rewards_transactions')
        .where('user_id', userId)
        .where('reason', 'Milestone: 1000 points')
        .first();

      if (!existingMilestone) {
        await this.awardBonusPoints(userId, 100, 'Milestone: 1000 points', trx);
        milestones.push({ name: '1000 Points Club', bonus: 100 });
      }
    }

    // Monthly active user bonus
    const lastMonthActivity = await trx('supply_chain_events')
      .where('stakeholder_id', userId)
      .where('timestamp', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
      .count('* as count')
      .first();

    if (lastMonthActivity.count >= 10) {
      const lastBonus = await trx('rewards_transactions')
        .where('user_id', userId)
        .where('reason', 'Monthly active user bonus')
        .where('created_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .first();

      if (!lastBonus) {
        await this.awardBonusPoints(userId, this.pointsConfig.monthlyActiveBonus, 'Monthly active user bonus', trx);
        milestones.push({ name: 'Monthly Active User', bonus: this.pointsConfig.monthlyActiveBonus });
      }
    }

    return milestones;
  }

  // Award bonus points (internal use)
  async awardBonusPoints(userId, amount, reason, trx) {
    const transaction = {
      id: uuidv4(),
      user_id: userId,
      type: 'bonus',
      amount: amount,
      reason: reason,
      metadata: JSON.stringify({
        timestamp: new Date(),
        source: 'system'
      }),
      created_at: new Date(),
      updated_at: new Date()
    };

    await trx('rewards_transactions').insert(transaction);
    await trx('users').where('id', userId).increment('rewards_balance', amount);
  }

  // Process product verification reward
  async processVerificationReward(userId, tokenId) {
    // Check if already rewarded for this verification
    const existingReward = await knex('rewards_transactions')
      .where('user_id', userId)
      .where('related_validation_id', tokenId)
      .first();

    if (existingReward) {
      return { success: false, message: 'Already rewarded for this verification' };
    }

    // Award points
    return await this.awardPoints(
      userId,
      'validation',
      this.pointsConfig.productVerification,
      'Product verification',
      tokenId
    );
  }

  // Process counterfeit report reward
  async processReportReward(userId, reportId, status) {
    const report = await knex('counterfeit_reports')
      .where('id', reportId)
      .first();

    if (!report) {
      throw new Error('Report not found');
    }

    let amount = 0;
    let reason = '';

    switch (status) {
      case 'submitted':
        amount = this.pointsConfig.counterfeitReportSubmitted;
        reason = 'Counterfeit report submitted';
        break;
      case 'confirmed':
        amount = this.pointsConfig.counterfeitReportConfirmed;
        reason = 'Counterfeit report confirmed';
        break;
      default:
        return { success: false, message: 'Invalid report status' };
    }

    // Update report with reward amount
    await knex('counterfeit_reports')
      .where('id', reportId)
      .update({
        reward_amount: amount,
        updated_at: new Date()
      });

    return await this.awardPoints(userId, 'counterfeit_report', amount, reason, reportId);
  }

  // Get available rewards catalog
  async getAvailableRewards(userId) {
    const user = await knex('users').where('id', userId).select('rewards_balance').first();
    
    if (!user) {
      throw new Error('User not found');
    }

    const rewards = await knex('rewards_catalog')
      .where('is_active', true)
      .where('points_required', '<=', user.rewards_balance)
      .where(function() {
        this.whereNull('stock_quantity').orWhere('stock_quantity', '>', 0);
      })
      .orderBy('points_required', 'asc');

    return {
      balance: user.rewards_balance,
      availableRewards: rewards,
      categories: [...new Set(rewards.map(r => r.category))]
    };
  }

  // Redeem reward
  async redeemReward(userId, rewardId) {
    const trx = await knex.transaction();

    try {
      // Get user and reward details
      const user = await trx('users').where('id', userId).first();
      const reward = await trx('rewards_catalog').where('id', rewardId).first();

      if (!user || !reward) {
        throw new Error('User or reward not found');
      }

      if (!reward.is_active) {
        throw new Error('Reward is no longer available');
      }

      if (user.rewards_balance < reward.points_required) {
        throw new Error('Insufficient points balance');
      }

      if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
        throw new Error('Reward is out of stock');
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Create redemption transaction
      const transactionId = uuidv4();
      await trx('rewards_transactions').insert({
        id: transactionId,
        user_id: userId,
        type: 'redeemed',
        amount: -reward.points_required,
        reason: `Redeemed: ${reward.name}`,
        metadata: JSON.stringify({
          rewardId: rewardId,
          redemptionCode: redemptionCode
        }),
        created_at: new Date(),
        updated_at: new Date()
      });

      // Create redemption record
      const redemption = {
        id: uuidv4(),
        user_id: userId,
        reward_id: rewardId,
        transaction_id: transactionId,
        redemption_code: redemptionCode,
        status: 'pending',
        delivery_details: JSON.stringify({
          email: user.email,
          phone: user.phone
        }),
        created_at: new Date(),
        updated_at: new Date()
      };

      await trx('rewards_redemptions').insert(redemption);

      // Update user balance
      await trx('users')
        .where('id', userId)
        .decrement('rewards_balance', reward.points_required);

      // Update stock if applicable
      if (reward.stock_quantity !== null) {
        await trx('rewards_catalog')
          .where('id', rewardId)
          .decrement('stock_quantity', 1);
      }

      await trx.commit();

      return {
        success: true,
        redemption: redemption,
        redemptionCode: redemptionCode,
        newBalance: user.rewards_balance - reward.points_required
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Generate unique redemption code
  generateRedemptionCode() {
    const prefix = 'AUTH';
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${prefix}-${randomPart}-${timestamp}`;
  }

  // Get user rewards history
  async getUserRewardsHistory(userId, limit = 20) {
    const transactions = await knex('rewards_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    const redemptions = await knex('rewards_redemptions as r')
      .join('rewards_catalog as rc', 'r.reward_id', 'rc.id')
      .where('r.user_id', userId)
      .select('r.*', 'rc.name as reward_name', 'rc.category as reward_category')
      .orderBy('r.created_at', 'desc')
      .limit(10);

    const stats = await knex('rewards_transactions')
      .where('user_id', userId)
      .select(
        knex.raw('SUM(CASE WHEN type = "earned" THEN amount ELSE 0 END) as total_earned'),
        knex.raw('SUM(CASE WHEN type = "redeemed" THEN ABS(amount) ELSE 0 END) as total_redeemed'),
        knex.raw('COUNT(DISTINCT DATE(created_at)) as active_days')
      )
      .first();

    return {
      transactions,
      redemptions,
      stats: {
        totalEarned: parseFloat(stats.total_earned || 0),
        totalRedeemed: parseFloat(stats.total_redeemed || 0),
        activeDays: parseInt(stats.active_days || 0)
      }
    };
  }

  // Process referral bonus
  async processReferralBonus(referrerId, referredUserId) {
    // Check if referral bonus already given
    const existingBonus = await knex('rewards_transactions')
      .where('user_id', referrerId)
      .where('metadata', 'like', `%"referredUser":"${referredUserId}"%`)
      .first();

    if (existingBonus) {
      return { success: false, message: 'Referral bonus already awarded' };
    }

    // Award bonus to referrer
    const referrerReward = await this.awardPoints(
      referrerId,
      'referral',
      this.pointsConfig.referralBonus,
      'Referral bonus',
      null
    );

    // Award welcome bonus to new user
    const newUserReward = await this.awardPoints(
      referredUserId,
      'welcome',
      this.pointsConfig.firstTimeBonus,
      'Welcome bonus',
      null
    );

    return {
      success: true,
      referrerReward,
      newUserReward
    };
  }

  // Get rewards leaderboard
  async getLeaderboard(timeframe = 'month') {
    let dateFilter = knex.raw('DATE_SUB(NOW(), INTERVAL 1 MONTH)');
    
    if (timeframe === 'week') {
      dateFilter = knex.raw('DATE_SUB(NOW(), INTERVAL 1 WEEK)');
    } else if (timeframe === 'all') {
      dateFilter = '1970-01-01';
    }

    const leaderboard = await knex('rewards_transactions as rt')
      .join('users as u', 'rt.user_id', 'u.id')
      .where('rt.type', 'earned')
      .where('rt.created_at', '>=', dateFilter)
      .groupBy('rt.user_id', 'u.email')
      .select(
        'rt.user_id',
        'u.email',
        knex.raw('JSON_EXTRACT(u.profile, "$.firstName") as first_name'),
        knex.raw('JSON_EXTRACT(u.profile, "$.lastName") as last_name'),
        knex.raw('SUM(rt.amount) as points_earned'),
        knex.raw('COUNT(DISTINCT DATE(rt.created_at)) as active_days')
      )
      .orderBy('points_earned', 'desc')
      .limit(10);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      name: `${entry.first_name || 'Anonymous'} ${entry.last_name ? entry.last_name[0] + '.' : ''}`,
      pointsEarned: parseFloat(entry.points_earned),
      activeDays: parseInt(entry.active_days)
    }));
  }

  // Get reward analytics
  async getRewardAnalytics(startDate, endDate) {
    const analytics = {
      totalPointsAwarded: 0,
      totalPointsRedeemed: 0,
      activeUsers: 0,
      popularRewards: [],
      rewardsByCategory: {},
      averagePointsPerUser: 0
    };

    // Total points awarded
    const awarded = await knex('rewards_transactions')
      .where('type', 'earned')
      .whereBetween('created_at', [startDate, endDate])
      .sum('amount as total')
      .first();
    analytics.totalPointsAwarded = parseFloat(awarded.total || 0);

    // Total points redeemed
    const redeemed = await knex('rewards_transactions')
      .where('type', 'redeemed')
      .whereBetween('created_at', [startDate, endDate])
      .sum('amount as total')
      .first();
    analytics.totalPointsRedeemed = Math.abs(parseFloat(redeemed.total || 0));

    // Active users
    const activeUsers = await knex('rewards_transactions')
      .whereBetween('created_at', [startDate, endDate])
      .countDistinct('user_id as count')
      .first();
    analytics.activeUsers = parseInt(activeUsers.count || 0);

    // Average points per user
    if (analytics.activeUsers > 0) {
      analytics.averagePointsPerUser = analytics.totalPointsAwarded / analytics.activeUsers;
    }

    // Popular rewards
    const popularRewards = await knex('rewards_redemptions as rr')
      .join('rewards_catalog as rc', 'rr.reward_id', 'rc.id')
      .whereBetween('rr.created_at', [startDate, endDate])
      .groupBy('rr.reward_id', 'rc.name', 'rc.category')
      .select(
        'rc.name',
        'rc.category',
        knex.raw('COUNT(*) as redemption_count')
      )
      .orderBy('redemption_count', 'desc')
      .limit(5);
    analytics.popularRewards = popularRewards;

    // Rewards by category
    const categoryStats = await knex('rewards_redemptions as rr')
      .join('rewards_catalog as rc', 'rr.reward_id', 'rc.id')
      .whereBetween('rr.created_at', [startDate, endDate])
      .groupBy('rc.category')
      .select(
        'rc.category',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(rc.points_required) as total_points')
      );

    categoryStats.forEach(stat => {
      analytics.rewardsByCategory[stat.category] = {
        count: parseInt(stat.count),
        totalPoints: parseFloat(stat.total_points)
      };
    });

    return analytics;
  }
}

module.exports = new RewardsService();