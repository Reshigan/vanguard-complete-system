import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, Star, TrendingUp, Users, Target, 
  Award, Zap, Calendar, ChevronRight, Clock,
  Share2, Filter, Search
} from 'lucide-react';
import { api } from '../../services/api';

const EnhancedRewardsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/rewards/v2/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching rewards dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId) => {
    try {
      setClaimingReward(true);
      const response = await api.post('/rewards/v2/claim', {
        rewardId,
        deliveryDetails: {
          // In production, collect actual delivery details
          method: 'email'
        }
      });

      if (response.data.success) {
        alert(response.data.data.message);
        fetchDashboardData(); // Refresh data
        setSelectedReward(null);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to claim reward');
    } finally {
      setClaimingReward(false);
    }
  };

  const shareAchievement = async (achievementId) => {
    try {
      const response = await api.post('/rewards/v2/share', {
        achievementId,
        platform: 'twitter'
      });

      if (response.data.success) {
        alert(response.data.data.message);
        // In production, open share dialog
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(response.data.data.shareContent.title)}&url=${encodeURIComponent(response.data.data.shareContent.url)}`,
          '_blank'
        );
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading rewards data</div>;
  }

  const { user, rewards, achievements, earnings } = dashboardData;

  const filteredRewards = rewards.available.filter(reward => {
    if (filter !== 'all' && reward.reward_type !== filter) return false;
    if (searchTerm && !reward.reward_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Rewards & Achievements</h1>
        <p className="text-gray-600">Earn points, unlock rewards, and track your progress</p>
      </div>

      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{user.balance.toLocaleString()}</span>
          </div>
          <p className="text-sm opacity-90">Current Points</p>
          <p className="text-xs mt-1 opacity-75">Rank #{user.rank}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold">{user.nextMilestone.target.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600">Next Milestone</p>
          <p className="text-xs text-gray-500 mt-1">{user.nextMilestone.pointsNeeded} points to go</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold">{earnings.streak.current}</span>
          </div>
          <p className="text-sm text-gray-600">Day Streak</p>
          <p className="text-xs text-gray-500 mt-1">Best: {earnings.streak.longest} days</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold">{earnings.averageDaily}</span>
          </div>
          <p className="text-sm text-gray-600">Daily Average</p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        {['overview', 'catalog', 'achievements', 'leaderboard', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Recommended Rewards */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.recommendations.slice(0, 3).map((reward) => (
                <div key={reward.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{reward.reward_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {reward.reward_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {reward.points_required.toLocaleString()} pts
                    </span>
                    <button
                      onClick={() => setSelectedReward(reward)}
                      disabled={!reward.canAfford}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reward.canAfford ? 'Claim' : 'Insufficient Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Achievements */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Achievements in Progress
            </h2>
            <div className="space-y-3">
              {achievements.inProgress.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{achievement.metadata?.icon || '🏆'}</span>
                      <div>
                        <h3 className="font-semibold">{achievement.achievement_type.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-gray-600">
                          Level: {achievement.achievement_level}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {achievement.progress}/{achievement.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Recent Activity
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.history.slice(0, 5).map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{activity.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">+{activity.points}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'gift', 'discount', 'badge', 'experience'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {reward.image_url && (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <Gift className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{reward.reward_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      {reward.points_required.toLocaleString()} pts
                    </span>
                    {reward.quantityRemaining !== null && (
                      <span className="text-xs text-gray-500">
                        {reward.quantityRemaining} left
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedReward(reward)}
                    disabled={!reward.canAfford}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {reward.canAfford ? 'View Details' : 'Insufficient Points'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unlocked Achievements */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Unlocked Achievements</h2>
            <div className="space-y-3">
              {achievements.unlocked.map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                        {achievement.achievement_level[0].toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold">{achievement.achievement_type.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-gray-600">
                          Achieved on {new Date(achievement.achieved_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => shareAchievement(achievement.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements in Progress */}
          <div>
            <h2 className="text-xl font-semibold mb-4">In Progress</h2>
            <div className="space-y-3">
              {achievements.inProgress.map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{achievement.achievement_type.replace(/_/g, ' ')}</h3>
                    <span className="text-sm text-gray-500">
                      {achievement.progress}/{achievement.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {achievement.target - achievement.progress} more to unlock {achievement.achievement_level} level
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reward Details Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{selectedReward.reward_name}</h2>
            <p className="text-gray-600 mb-4">{selectedReward.description}</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Points Required:</span>
                <span className="font-semibold">{selectedReward.points_required.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Balance:</span>
                <span className="font-semibold">{user.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Claiming:</span>
                <span className="font-semibold">
                  {(user.balance - selectedReward.points_required).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedReward.terms_conditions && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-600">
                  Terms: {JSON.parse(selectedReward.terms_conditions).validity}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => claimReward(selectedReward.id)}
                disabled={claimingReward || !selectedReward.canAfford}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {claimingReward ? 'Processing...' : 'Claim Reward'}
              </button>
              <button
                onClick={() => setSelectedReward(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRewardsDashboard;