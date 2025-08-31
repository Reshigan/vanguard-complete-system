const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class EnhancedRewardsController {
  // Get comprehensive rewards dashboard
  async getRewardsDashboard(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user's current balance and profile
      const user = await knex('users')
        .where('id', userId)
        .select('rewards_balance', 'profile', 'created_at')
        .first();
      
      // Get available rewards from catalog
      const availableRewards = await knex('rewards_catalog')
        .where('is_active', true)
        .where('valid_from', '<=', new Date())
        .where('valid_until', '>=', new Date())
        .orderBy('points_required', 'asc');
      
      // Get user's claimed rewards
      const claimedRewards = await knex('user_rewards')
        .join('rewards_catalog', 'user_rewards.reward_id', 'rewards_catalog.id')
        .where('user_rewards.user_id', userId)
        .orderBy('user_rewards.created_at', 'desc')
        .limit(10)
        .select(
          'user_rewards.*',
          'rewards_catalog.reward_name',
          'rewards_catalog.reward_type',
          'rewards_catalog.description',
          'rewards_catalog.image_url'
        );
      
      // Get user's achievements
      const achievements = await knex('user_achievements')
        .where('user_id', userId)
        .orderBy('achieved_at', 'desc');
      
      // Get earning history
      const earningHistory = await this.getEarningHistory(userId, 30);
      
      // Get user's rank
      const userRank = await this.getUserRank(userId);
      
      // Get personalized recommendations
      const recommendations = await this.getPersonalizedRecommendations(userId, user.rewards_balance);
      
      res.json({
        success: true,
        data: {
          user: {
            balance: user.rewards_balance || 0,
            memberSince: user.created_at,
            rank: userRank,
            nextMilestone: this.getNextMilestone(user.rewards_balance)
          },
          rewards: {
            available: availableRewards.map(reward => ({
              ...reward,
              canAfford: user.rewards_balance >= reward.points_required,
              quantityRemaining: reward.quantity_available,
              popularity: this.calculatePopularity(reward.id)
            })),
            claimed: claimedRewards,
            recommendations
          },
          achievements: {
            unlocked: achievements.filter(a => a.achieved_at !== null),
            inProgress: achievements.filter(a => a.achieved_at === null),
            totalPoints: achievements.reduce((sum, a) => sum + (a.achieved_at ? this.getAchievementPoints(a) : 0), 0)
          },
          earnings: {
            history: earningHistory,
            totalEarned: earningHistory.reduce((sum, e) => sum + e.points, 0),
            averageDaily: this.calculateAverageDaily(earningHistory),
            streak: await this.getValidationStreak(userId)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching rewards dashboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rewards dashboard' });
    }
  }

  // Claim a reward with enhanced validation
  async claimReward(req, res) {
    const trx = await knex.transaction();
    
    try {
      const userId = req.user.id;
      const { rewardId, deliveryDetails } = req.body;
      
      // Lock user record for update
      const user = await trx('users')
        .where('id', userId)
        .select('rewards_balance', 'email', 'profile')
        .forUpdate()
        .first();
      
      // Get reward details with lock
      const reward = await trx('rewards_catalog')
        .where('id', rewardId)
        .where('is_active', true)
        .forUpdate()
        .first();
      
      // Validations
      if (!reward) {
        await trx.rollback();
        return res.status(404).json({ success: false, error: 'Reward not found' });
      }
      
      if (user.rewards_balance < reward.points_required) {
        await trx.rollback();
        return res.status(400).json({ success: false, error: 'Insufficient balance' });
      }
      
      if (reward.quantity_available !== null && reward.quantity_available <= 0) {
        await trx.rollback();
        return res.status(400).json({ success: false, error: 'Reward out of stock' });
      }
      
      // Check claim limits
      const previousClaims = await trx('user_rewards')
        .where('user_id', userId)
        .where('reward_id', rewardId)
        .where('created_at', '>', knex.raw("NOW() - INTERVAL '30 days'"))
        .count('* as count')
        .first();
      
      if (reward.reward_type !== 'badge' && previousClaims.count >= 3) {
        await trx.rollback();
        return res.status(400).json({ success: false, error: 'Claim limit reached for this reward' });
      }
      
      // Process the claim
      const claimId = uuidv4();
      
      // Deduct points
      await trx('users')
        .where('id', userId)
        .decrement('rewards_balance', reward.points_required);
      
      // Create claim record
      await trx('user_rewards').insert({
        id: claimId,
        user_id: userId,
        reward_id: rewardId,
        points_spent: reward.points_required,
        status: 'pending',
        redemption_details: JSON.stringify({
          ...deliveryDetails,
          claimed_at: new Date(),
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }),
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
      });
      
      // Update reward quantity
      if (reward.quantity_available !== null) {
        await trx('rewards_catalog')
          .where('id', rewardId)
          .decrement('quantity_available', 1);
      }
      
      // Check for new achievements
      await this.checkRewardAchievements(trx, userId, reward);
      
      // Send notification (in production, this would send email/push)
      await this.sendRewardNotification(user, reward, claimId);
      
      await trx.commit();
      
      res.json({
        success: true,
        data: {
          claimId,
          reward: {
            name: reward.reward_name,
            type: reward.reward_type,
            description: reward.description
          },
          newBalance: user.rewards_balance - reward.points_required,
          message: this.getClaimSuccessMessage(reward)
        }
      });
    } catch (error) {
      await trx.rollback();
      logger.error('Error claiming reward:', error);
      res.status(500).json({ success: false, error: 'Failed to claim reward' });
    }
  }

  // Get dynamic leaderboard with filters
  async getLeaderboard(req, res) {
    try {
      const { timeframe = 'all', category = 'points', limit = 100, offset = 0 } = req.query;
      const userId = req.user.id;
      
      let query;
      
      if (category === 'points') {
        query = knex('users')
          .where('role', 'consumer')
          .orderBy('rewards_balance', 'desc');
      } else if (category === 'validations') {
        query = knex('users')
          .join(
            knex('supply_chain_events')
              .select('stakeholder_id')
              .count('* as validation_count')
              .where('event_type', 'validation')
              .groupBy('stakeholder_id')
              .as('validations'),
            'users.id',
            'validations.stakeholder_id'
          )
          .where('users.role', 'consumer')
          .orderBy('validations.validation_count', 'desc');
      } else if (category === 'reports') {
        query = knex('users')
          .join(
            knex('counterfeit_reports')
              .select('reporter_id')
              .count('* as report_count')
              .where('status', 'confirmed')
              .groupBy('reporter_id')
              .as('reports'),
            'users.id',
            'reports.reporter_id'
          )
          .where('users.role', 'consumer')
          .orderBy('reports.report_count', 'desc');
      }
      
      // Apply timeframe filter
      if (timeframe !== 'all') {
        const startDate = new Date();
        if (timeframe === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (timeframe === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (timeframe === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
        
        // Add date filter based on category
        if (category === 'validations') {
          query.where('supply_chain_events.timestamp', '>=', startDate);
        } else if (category === 'reports') {
          query.where('counterfeit_reports.created_at', '>=', startDate);
        }
      }
      
      // Get paginated results
      const leaderboard = await query
        .limit(limit)
        .offset(offset)
        .select('users.id', 'users.profile', 'users.rewards_balance');
      
      // Get user's rank
      const userRankQuery = knex('users').where('role', 'consumer');
      
      if (category === 'points') {
        userRankQuery.where('rewards_balance', '>', 
          knex('users').where('id', userId).select('rewards_balance')
        );
      }
      
      const userRank = await userRankQuery.count('* as rank').first();
      
      // Format leaderboard with privacy
      const formattedLeaderboard = leaderboard.map((user, index) => {
        const profile = JSON.parse(user.profile || '{}');
        return {
          rank: offset + index + 1,
          userId: user.id,
          displayName: this.formatDisplayName(profile),
          score: user.rewards_balance || 0,
          badges: this.getUserBadges(user.id),
          isCurrentUser: user.id === userId,
          country: profile.country || 'Unknown'
        };
      });
      
      res.json({
        success: true,
        data: {
          leaderboard: formattedLeaderboard,
          userRank: (userRank.rank || 0) + 1,
          pagination: {
            limit,
            offset,
            hasMore: leaderboard.length === limit
          },
          filters: {
            timeframe,
            category
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
  }

  // Get gamification progress
  async getGamificationProgress(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all achievement types with progress
      const achievements = await this.getDetailedAchievements(userId);
      
      // Get current challenges
      const challenges = await this.getActiveChallenges(userId);
      
      // Get badges
      const badges = await this.getUserBadgesDetailed(userId);
      
      // Get streak information
      const streaks = await this.getStreakInfo(userId);
      
      // Calculate overall progress
      const overallProgress = this.calculateOverallProgress(achievements, badges);
      
      res.json({
        success: true,
        data: {
          level: this.calculateUserLevel(overallProgress.totalPoints),
          achievements,
          challenges,
          badges,
          streaks,
          overallProgress,
          nextRewards: await this.getUpcomingRewards(userId)
        }
      });
    } catch (error) {
      logger.error('Error fetching gamification progress:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch gamification progress' });
    }
  }

  // Helper methods
  async getEarningHistory(userId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events = await knex('supply_chain_events')
      .where('stakeholder_id', userId)
      .whereIn('event_type', ['validation', 'counterfeit_report'])
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc');
    
    return events.map(event => ({
      type: event.event_type,
      date: event.timestamp,
      points: event.event_type === 'validation' ? 10 : 50,
      description: event.event_type === 'validation' ? 'Product validation' : 'Counterfeit report',
      metadata: event.metadata
    }));
  }

  async getUserRank(userId) {
    const result = await knex('users')
      .where('role', 'consumer')
      .where('rewards_balance', '>', 
        knex('users').where('id', userId).select('rewards_balance')
      )
      .count('* as rank')
      .first();
    
    return (result.rank || 0) + 1;
  }

  async getPersonalizedRecommendations(userId, balance) {
    // Get user's claim history
    const claimHistory = await knex('user_rewards')
      .where('user_id', userId)
      .select('reward_id')
      .pluck('reward_id');
    
    // Get popular rewards user hasn't claimed
    const recommendations = await knex('rewards_catalog')
      .whereNotIn('id', claimHistory)
      .where('is_active', true)
      .where('points_required', '<=', balance * 2) // Within reach
      .orderBy('points_required', 'asc')
      .limit(5);
    
    return recommendations;
  }

  getNextMilestone(currentBalance) {
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const nextMilestone = milestones.find(m => m > currentBalance);
    
    return {
      target: nextMilestone || 1000000,
      pointsNeeded: nextMilestone ? nextMilestone - currentBalance : 1000000 - currentBalance,
      reward: this.getMilestoneReward(nextMilestone)
    };
  }

  getMilestoneReward(milestone) {
    const rewards = {
      100: 'Bronze Validator Badge',
      500: 'Silver Validator Badge',
      1000: 'Gold Validator Badge',
      2500: 'Platinum Badge + $25 Bonus',
      5000: 'Diamond Badge + VIP Status',
      10000: 'Master Validator + Exclusive Rewards',
      25000: 'Legend Status + Annual VIP Pass',
      50000: 'Hall of Fame + Lifetime Benefits',
      100000: 'Founding Member Status',
      1000000: 'Ultimate Validator - Legendary Status'
    };
    
    return rewards[milestone] || 'Ultimate Validator Status';
  }

  calculatePopularity(rewardId) {
    // In production, this would calculate based on claim frequency
    return Math.floor(Math.random() * 100);
  }

  getAchievementPoints(achievement) {
    const points = {
      bronze: 100,
      silver: 500,
      gold: 1000,
      platinum: 2500
    };
    
    return points[achievement.achievement_level] || 0;
  }

  calculateAverageDaily(earningHistory) {
    if (earningHistory.length === 0) return 0;
    
    const days = new Set(earningHistory.map(e => 
      new Date(e.date).toDateString()
    )).size;
    
    const totalPoints = earningHistory.reduce((sum, e) => sum + e.points, 0);
    
    return Math.round(totalPoints / Math.max(days, 1));
  }

  async getValidationStreak(userId) {
    // Get last 30 days of validations
    const validations = await knex('supply_chain_events')
      .where('stakeholder_id', userId)
      .where('event_type', 'validation')
      .where('timestamp', '>=', knex.raw("NOW() - INTERVAL '30 days'"))
      .orderBy('timestamp', 'desc')
      .select(knex.raw('DATE(timestamp) as date'));
    
    if (validations.length === 0) return { current: 0, longest: 0 };
    
    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = new Date(validations[0].date);
    
    for (let i = 1; i < validations.length; i++) {
      const currentDate = new Date(validations[i].date);
      const dayDiff = (lastDate - currentDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      
      lastDate = currentDate;
    }
    
    // Check if current streak is ongoing
    const today = new Date();
    const lastValidation = new Date(validations[0].date);
    const daysSinceLastValidation = (today - lastValidation) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastValidation <= 1) {
      currentStreak = tempStreak;
    }
    
    return {
      current: currentStreak,
      longest: Math.max(longestStreak, tempStreak)
    };
  }

  async checkRewardAchievements(trx, userId, reward) {
    // Check if user has achieved reward-related milestones
    const claimCount = await trx('user_rewards')
      .where('user_id', userId)
      .count('* as count')
      .first();
    
    // Award achievements based on claims
    if (claimCount.count === 1) {
      await this.awardAchievement(trx, userId, 'first_reward', 'bronze');
    } else if (claimCount.count === 10) {
      await this.awardAchievement(trx, userId, 'reward_collector', 'silver');
    } else if (claimCount.count === 50) {
      await this.awardAchievement(trx, userId, 'reward_master', 'gold');
    }
    
    // Check for specific reward type achievements
    if (reward.reward_type === 'experience' && claimCount.count === 1) {
      await this.awardAchievement(trx, userId, 'experience_seeker', 'bronze');
    }
  }

  async awardAchievement(trx, userId, achievementType, level) {
    const existing = await trx('user_achievements')
      .where('user_id', userId)
      .where('achievement_type', achievementType)
      .first();
    
    if (!existing) {
      const achievementId = uuidv4();
      await trx('user_achievements').insert({
        id: achievementId,
        user_id: userId,
        achievement_type: achievementType,
        achievement_level: level,
        progress: 1,
        target: 1,
        achieved_at: new Date()
      });
      
      // Award bonus points
      const bonusPoints = this.getAchievementPoints({ achievement_level: level });
      await trx('users')
        .where('id', userId)
        .increment('rewards_balance', bonusPoints);
    }
  }

  async sendRewardNotification(user, reward, claimId) {
    // In production, this would send actual notifications
    logger.info(`Reward claimed: ${reward.reward_name} by user ${user.email} (Claim ID: ${claimId})`);
  }

  getClaimSuccessMessage(reward) {
    const messages = {
      gift: `Your ${reward.reward_name} has been claimed! Check your email for redemption instructions.`,
      discount: `Your discount code has been generated! Use it on your next purchase.`,
      badge: `Congratulations! You've earned the ${reward.reward_name}!`,
      experience: `Amazing! Your ${reward.reward_name} booking confirmation will be sent shortly.`
    };
    
    return messages[reward.reward_type] || 'Reward claimed successfully!';
  }

  formatDisplayName(profile) {
    if (!profile.firstName) return 'Anonymous User';
    
    const lastName = profile.lastName ? profile.lastName[0] + '.' : '';
    return `${profile.firstName} ${lastName}`.trim();
  }

  async getUserBadges(userId) {
    const badges = await knex('user_achievements')
      .where('user_id', userId)
      .where('achieved_at', 'is not', null)
      .select('achievement_type', 'achievement_level');
    
    return badges.map(b => ({
      type: b.achievement_type,
      level: b.achievement_level
    }));
  }

  async getDetailedAchievements(userId) {
    const achievementDefinitions = this.getAchievementDefinitions();
    const userAchievements = await knex('user_achievements')
      .where('user_id', userId);
    
    return achievementDefinitions.map(def => {
      const userAch = userAchievements.find(a => a.achievement_type === def.type);
      
      return {
        ...def,
        currentLevel: userAch ? userAch.achievement_level : null,
        progress: userAch ? userAch.progress : 0,
        target: userAch ? userAch.target : def.levels[0].target,
        completed: userAch && userAch.achieved_at !== null,
        achievedAt: userAch ? userAch.achieved_at : null,
        nextLevel: this.getNextLevel(def, userAch),
        percentComplete: userAch ? (userAch.progress / userAch.target) * 100 : 0
      };
    });
  }

  getAchievementDefinitions() {
    return [
      {
        type: 'first_scan',
        name: 'First Steps',
        description: 'Complete your first product validation',
        icon: '🎯',
        levels: [
          { level: 'bronze', target: 1, points: 100 }
        ]
      },
      {
        type: 'counterfeit_hunter',
        name: 'Counterfeit Hunter',
        description: 'Report counterfeit products',
        icon: '🕵️',
        levels: [
          { level: 'bronze', target: 1, points: 200 },
          { level: 'silver', target: 5, points: 500 },
          { level: 'gold', target: 10, points: 1000 },
          { level: 'platinum', target: 25, points: 2500 }
        ]
      },
      {
        type: 'loyal_customer',
        name: 'Brand Loyalist',
        description: 'Validate products regularly',
        icon: '⭐',
        levels: [
          { level: 'bronze', target: 10, points: 150 },
          { level: 'silver', target: 50, points: 500 },
          { level: 'gold', target: 100, points: 1000 },
          { level: 'platinum', target: 500, points: 5000 }
        ]
      },
      {
        type: 'streak_master',
        name: 'Consistency King',
        description: 'Validate products on consecutive days',
        icon: '🔥',
        levels: [
          { level: 'bronze', target: 7, points: 300 },
          { level: 'silver', target: 30, points: 1000 },
          { level: 'gold', target: 100, points: 3000 }
        ]
      },
      {
        type: 'social_validator',
        name: 'Community Champion',
        description: 'Share validations and invite friends',
        icon: '👥',
        levels: [
          { level: 'bronze', target: 5, points: 200 },
          { level: 'silver', target: 20, points: 800 },
          { level: 'gold', target: 50, points: 2000 }
        ]
      }
    ];
  }

  getNextLevel(definition, userAchievement) {
    if (!userAchievement) return definition.levels[0];
    
    const currentIndex = definition.levels.findIndex(l => l.level === userAchievement.achievement_level);
    return definition.levels[currentIndex + 1] || null;
  }

  async getActiveChallenges(userId) {
    // Weekly and monthly challenges
    const challenges = [
      {
        id: 'weekly_validator',
        name: 'Weekly Validator',
        description: 'Validate 10 products this week',
        type: 'weekly',
        target: 10,
        reward: 100,
        progress: await this.getWeeklyValidations(userId),
        endsAt: this.getEndOfWeek()
      },
      {
        id: 'counterfeit_buster',
        name: 'Counterfeit Buster',
        description: 'Report 3 counterfeit products this month',
        type: 'monthly',
        target: 3,
        reward: 500,
        progress: await this.getMonthlyReports(userId),
        endsAt: this.getEndOfMonth()
      },
      {
        id: 'streak_builder',
        name: 'Streak Builder',
        description: 'Maintain a 7-day validation streak',
        type: 'ongoing',
        target: 7,
        reward: 300,
        progress: (await this.getValidationStreak(userId)).current,
        endsAt: null
      }
    ];
    
    return challenges.map(c => ({
      ...c,
      percentComplete: (c.progress / c.target) * 100,
      completed: c.progress >= c.target,
      daysRemaining: c.endsAt ? Math.ceil((c.endsAt - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));
  }

  async getWeeklyValidations(userId) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const result = await knex('supply_chain_events')
      .where('stakeholder_id', userId)
      .where('event_type', 'validation')
      .where('timestamp', '>=', startOfWeek)
      .count('* as count')
      .first();
    
    return result.count || 0;
  }

  async getMonthlyReports(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await knex('counterfeit_reports')
      .where('reporter_id', userId)
      .where('created_at', '>=', startOfMonth)
      .count('* as count')
      .first();
    
    return result.count || 0;
  }

  getEndOfWeek() {
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  getEndOfMonth() {
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    return endOfMonth;
  }

  async getUserBadgesDetailed(userId) {
    const achievements = await knex('user_achievements')
      .where('user_id', userId)
      .where('achieved_at', 'is not', null);
    
    const specialBadges = [
      {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Among the first 1000 users',
        icon: '🌟',
        rarity: 'legendary'
      },
      {
        id: 'perfect_month',
        name: 'Perfect Month',
        description: 'Validated products every day for a month',
        icon: '📅',
        rarity: 'epic'
      },
      {
        id: 'global_validator',
        name: 'Global Validator',
        description: 'Validated products in 5+ countries',
        icon: '🌍',
        rarity: 'rare'
      }
    ];
    
    // Check for special badges
    const userBadges = [];
    
    // Check early adopter
    const userNumber = await knex('users')
      .where('role', 'consumer')
      .where('created_at', '<', 
        knex('users').where('id', userId).select('created_at')
      )
      .count('* as position')
      .first();
    
    if (userNumber.position < 1000) {
      userBadges.push(specialBadges[0]);
    }
    
    // Add achievement badges
    achievements.forEach(ach => {
      userBadges.push({
        id: `${ach.achievement_type}_${ach.achievement_level}`,
        name: this.getAchievementBadgeName(ach),
        description: this.getAchievementBadgeDescription(ach),
        icon: this.getAchievementIcon(ach.achievement_type),
        rarity: ach.achievement_level,
        earnedAt: ach.achieved_at
      });
    });
    
    return userBadges;
  }

  getAchievementBadgeName(achievement) {
    const names = {
      first_scan: 'First Scanner',
      counterfeit_hunter: 'Counterfeit Hunter',
      loyal_customer: 'Brand Loyalist',
      streak_master: 'Streak Master',
      social_validator: 'Community Champion'
    };
    
    const level = achievement.achievement_level.charAt(0).toUpperCase() + 
                  achievement.achievement_level.slice(1);
    
    return `${level} ${names[achievement.achievement_type] || 'Achiever'}`;
  }

  getAchievementBadgeDescription(achievement) {
    return `Earned the ${achievement.achievement_level} level in ${achievement.achievement_type.replace(/_/g, ' ')}`;
  }

  getAchievementIcon(type) {
    const icons = {
      first_scan: '🎯',
      counterfeit_hunter: '🕵️',
      loyal_customer: '⭐',
      streak_master: '🔥',
      social_validator: '👥'
    };
    
    return icons[type] || '🏆';
  }

  async getStreakInfo(userId) {
    const validationStreak = await this.getValidationStreak(userId);
    
    // Get other streak types
    const reportStreak = await this.getReportStreak(userId);
    const loginStreak = await this.getLoginStreak(userId);
    
    return {
      validation: {
        ...validationStreak,
        bonus: this.calculateStreakBonus(validationStreak.current)
      },
      report: {
        ...reportStreak,
        bonus: this.calculateStreakBonus(reportStreak.current, 5)
      },
      login: {
        ...loginStreak,
        bonus: this.calculateStreakBonus(loginStreak.current, 2)
      }
    };
  }

  async getReportStreak(userId) {
    // Similar to validation streak but for reports
    return { current: 0, longest: 0 }; // Simplified
  }

  async getLoginStreak(userId) {
    // Track daily logins
    return { current: 0, longest: 0 }; // Simplified
  }

  calculateStreakBonus(streakDays, multiplier = 10) {
    if (streakDays < 3) return 0;
    if (streakDays < 7) return multiplier * 1;
    if (streakDays < 30) return multiplier * 2;
    if (streakDays < 100) return multiplier * 5;
    return multiplier * 10;
  }

  calculateOverallProgress(achievements, badges) {
    const totalPossibleAchievements = achievements.reduce((sum, a) => sum + a.levels.length, 0);
    const completedAchievements = achievements.reduce((sum, a) => sum + (a.completed ? 1 : 0), 0);
    
    const totalPoints = achievements.reduce((sum, a) => {
      if (a.completed) {
        return sum + this.getAchievementPoints({ achievement_level: a.currentLevel });
      }
      return sum;
    }, 0);
    
    return {
      achievementProgress: (completedAchievements / totalPossibleAchievements) * 100,
      totalPoints,
      badgeCount: badges.length,
      level: this.calculateUserLevel(totalPoints)
    };
  }

  calculateUserLevel(totalPoints) {
    const levels = [
      { level: 1, minPoints: 0, name: 'Novice' },
      { level: 2, minPoints: 100, name: 'Apprentice' },
      { level: 3, minPoints: 500, name: 'Journeyman' },
      { level: 4, minPoints: 1000, name: 'Expert' },
      { level: 5, minPoints: 2500, name: 'Master' },
      { level: 6, minPoints: 5000, name: 'Grandmaster' },
      { level: 7, minPoints: 10000, name: 'Champion' },
      { level: 8, minPoints: 25000, name: 'Legend' },
      { level: 9, minPoints: 50000, name: 'Mythic' },
      { level: 10, minPoints: 100000, name: 'Immortal' }
    ];
    
    const userLevel = levels.reverse().find(l => totalPoints >= l.minPoints);
    const nextLevel = levels.find(l => l.level === userLevel.level + 1);
    
    return {
      current: userLevel.level,
      name: userLevel.name,
      points: totalPoints,
      nextLevel: nextLevel ? nextLevel.level : null,
      pointsToNext: nextLevel ? nextLevel.minPoints - totalPoints : 0,
      progressToNext: nextLevel ? ((totalPoints - userLevel.minPoints) / (nextLevel.minPoints - userLevel.minPoints)) * 100 : 100
    };
  }

  async getUpcomingRewards(userId) {
    const balance = await knex('users')
      .where('id', userId)
      .select('rewards_balance')
      .first()
      .then(u => u.rewards_balance);
    
    // Get rewards within reach (up to 2x current balance)
    const upcomingRewards = await knex('rewards_catalog')
      .where('is_active', true)
      .where('points_required', '>', balance)
      .where('points_required', '<=', balance * 2)
      .orderBy('points_required', 'asc')
      .limit(5);
    
    return upcomingRewards.map(reward => ({
      ...reward,
      pointsNeeded: reward.points_required - balance,
      daysToEarn: Math.ceil((reward.points_required - balance) / 50) // Assuming 50 points/day average
    }));
  }
}

module.exports = new EnhancedRewardsController();