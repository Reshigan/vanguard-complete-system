import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  Gift, 
  Trophy, 
  Target, 
  TrendingUp,
  ShoppingBag,
  Coffee,
  Smartphone,
  Car,
  Plane,
  Crown
} from 'lucide-react';

const RewardsProgram = ({ user, setUser }) => {
  const [activeSection, setActiveSection] = useState('overview');

  // Tier system configuration
  const tiers = {
    Bronze: { min: 0, max: 499, color: 'amber', icon: Award },
    Silver: { min: 500, max: 1499, color: 'gray', icon: Star },
    Gold: { min: 1500, max: 2999, color: 'yellow', icon: Trophy },
    Platinum: { min: 3000, max: Infinity, color: 'purple', icon: Crown }
  };

  const currentTier = tiers[user.tier];
  const nextTier = Object.entries(tiers).find(([name, tier]) => tier.min > user.points)?.[0];
  const pointsToNext = nextTier ? tiers[nextTier].min - user.points : 0;

  // Available rewards
  const rewards = [
    {
      id: 1,
      name: 'R50 Discount Voucher',
      points: 500,
      category: 'voucher',
      icon: ShoppingBag,
      description: 'R50 off your next purchase at participating retailers',
      available: true,
      tier: 'Bronze'
    },
    {
      id: 2,
      name: 'Premium Coffee Mug',
      points: 750,
      category: 'merchandise',
      icon: Coffee,
      description: 'Exclusive Verifi branded ceramic coffee mug',
      available: true,
      tier: 'Silver'
    },
    {
      id: 3,
      name: 'Wireless Earbuds',
      points: 1200,
      category: 'electronics',
      icon: Smartphone,
      description: 'High-quality wireless earbuds with noise cancellation',
      available: user.points >= 1200,
      tier: 'Silver'
    },
    {
      id: 4,
      name: 'Weekend Getaway',
      points: 2500,
      category: 'experience',
      icon: Car,
      description: 'Two-night stay at a luxury resort in the Western Cape',
      available: user.points >= 2500,
      tier: 'Gold'
    },
    {
      id: 5,
      name: 'International Flight Voucher',
      points: 5000,
      category: 'travel',
      icon: Plane,
      description: 'R5000 flight voucher for international travel',
      available: user.points >= 5000,
      tier: 'Platinum'
    }
  ];

  // Recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'scan',
      points: 25,
      description: 'Verified Highland Reserve Whisky',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      type: 'report',
      points: 100,
      description: 'Reported counterfeit product',
      timestamp: '1 day ago'
    },
    {
      id: 3,
      type: 'scan',
      points: 25,
      description: 'Verified Amarula Cream Liqueur',
      timestamp: '2 days ago'
    },
    {
      id: 4,
      type: 'bonus',
      points: 50,
      description: 'Weekly scan bonus',
      timestamp: '3 days ago'
    }
  ];

  const redeemReward = (reward) => {
    if (user.points >= reward.points) {
      setUser(prev => ({
        ...prev,
        points: prev.points - reward.points
      }));
      alert(`Successfully redeemed: ${reward.name}! Check your email for details.`);
    } else {
      alert(`You need ${reward.points - user.points} more points to redeem this reward.`);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{user.points} Points</h3>
            <p className="text-green-100">Current Balance</p>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              {React.createElement(currentTier.icon, { className: "w-6 h-6 mr-2" })}
              <span className="text-xl font-bold">{user.tier}</span>
            </div>
            <p className="text-green-100">Member</p>
          </div>
        </div>
        
        {nextTier && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to {nextTier}</span>
              <span>{pointsToNext} points to go</span>
            </div>
            <div className="w-full bg-green-400 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, ((user.points - currentTier.min) / (tiers[nextTier].min - currentTier.min)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.totalScans}</p>
              <p className="text-sm text-gray-500">Products Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.counterfeitReports}</p>
              <p className="text-sm text-gray-500">Counterfeits Reported</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your {user.tier} Benefits</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700">25 points per product verification</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700">100+ bonus points for counterfeit reports</span>
          </div>
          {user.tier !== 'Bronze' && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Exclusive {user.tier} tier rewards</span>
            </div>
          )}
          {user.tier === 'Platinum' && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Priority customer support</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Available Rewards</h3>
        <div className="text-sm text-gray-500">
          Your balance: <span className="font-semibold text-green-600">{user.points} points</span>
        </div>
      </div>
      
      {rewards.map((reward) => {
        const Icon = reward.icon;
        const canAfford = user.points >= reward.points;
        
        return (
          <div 
            key={reward.id}
            className={`bg-white rounded-lg border p-4 ${canAfford ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className={`p-3 rounded-lg mr-4 ${canAfford ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Icon className={`w-6 h-6 ${canAfford ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-green-600">{reward.points} pts</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {reward.tier}+ tier
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => redeemReward(reward)}
                disabled={!canAfford}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canAfford
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Redeem' : 'Locked'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      
      {recentActivity.map((activity) => (
        <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                activity.type === 'scan' ? 'bg-green-500' :
                activity.type === 'report' ? 'bg-red-500' :
                'bg-blue-500'
              }`}></div>
              <div>
                <p className="font-medium text-gray-900">{activity.description}</p>
                <p className="text-sm text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">+{activity.points}</span>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Section Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'rewards', name: 'Rewards' },
          { id: 'activity', name: 'Activity' }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeSection === section.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {section.name}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'rewards' && renderRewards()}
      {activeSection === 'activity' && renderActivity()}
    </div>
  );
};

export default RewardsProgram;