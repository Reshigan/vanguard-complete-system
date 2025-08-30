import { useState } from 'react'
import { Gift, Star, Trophy, Target, TrendingUp } from 'lucide-react'

const Rewards = () => {
  const [currentBalance] = useState(250)
  const [selectedReward, setSelectedReward] = useState(null)

  const rewardHistory = [
    {
      id: '1',
      type: 'counterfeit_report',
      amount: 100,
      description: 'Confirmed counterfeit report - AuthentiGuard Reserve',
      date: '2024-08-25',
      status: 'completed'
    },
    {
      id: '2',
      type: 'product_validation',
      amount: 10,
      description: 'Product validation - Premium Spirits Classic',
      date: '2024-08-20',
      status: 'completed'
    },
    {
      id: '3',
      type: 'referral_bonus',
      amount: 50,
      description: 'Friend referral bonus',
      date: '2024-08-15',
      status: 'completed'
    },
    {
      id: '4',
      type: 'counterfeit_report',
      amount: 75,
      description: 'Confirmed counterfeit report - Bourbon Masters',
      date: '2024-08-10',
      status: 'completed'
    },
    {
      id: '5',
      type: 'product_validation',
      amount: 15,
      description: 'Premium product validation - Champagne Royale',
      date: '2024-08-05',
      status: 'completed'
    }
  ]

  const availableRewards = [
    {
      id: '1',
      title: '$10 Gift Card',
      description: 'Amazon, Target, or other major retailers',
      points: 100,
      category: 'gift_card',
      image: '🎁'
    },
    {
      id: '2',
      title: '$25 Gift Card',
      description: 'Premium selection of retailers',
      points: 250,
      category: 'gift_card',
      image: '🎁'
    },
    {
      id: '3',
      title: '$50 Gift Card',
      description: 'Wide variety of popular stores',
      points: 500,
      category: 'gift_card',
      image: '🎁'
    },
    {
      id: '4',
      title: 'AuthentiGuard T-Shirt',
      description: 'Official AuthentiGuard merchandise',
      points: 150,
      category: 'merchandise',
      image: '👕'
    },
    {
      id: '5',
      title: 'Premium Tasting Experience',
      description: 'Exclusive distillery tour and tasting',
      points: 1000,
      category: 'experience',
      image: '🥃'
    },
    {
      id: '6',
      title: 'Charity Donation',
      description: 'Donate to anti-counterfeiting initiatives',
      points: 200,
      category: 'charity',
      image: '❤️'
    }
  ]

  const achievements = [
    {
      id: '1',
      title: 'First Report',
      description: 'Submitted your first counterfeit report',
      icon: Star,
      earned: true,
      points: 25
    },
    {
      id: '2',
      title: 'Vigilant Guardian',
      description: 'Confirmed 5 counterfeit reports',
      icon: Trophy,
      earned: true,
      points: 100
    },
    {
      id: '3',
      title: 'Product Validator',
      description: 'Validated 50 authentic products',
      icon: Target,
      earned: false,
      progress: 23,
      total: 50,
      points: 150
    },
    {
      id: '4',
      title: 'Community Leader',
      description: 'Referred 10 friends to AuthentiGuard',
      icon: TrendingUp,
      earned: false,
      progress: 3,
      total: 10,
      points: 200
    }
  ]

  const getRewardTypeIcon = (type) => {
    const icons = {
      counterfeit_report: '🚨',
      product_validation: '✅',
      referral_bonus: '👥',
      achievement: '🏆'
    }
    return icons[type] || '⭐'
  }

  const handleRedeemReward = (reward) => {
    if (currentBalance >= reward.points) {
      setSelectedReward(reward)
      // In real app, this would trigger redemption process
      alert(`Redeeming ${reward.title} for ${reward.points} points!`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rewards</h1>
        <p className="text-gray-600">Earn points for protecting the community and redeem exciting rewards</p>
      </div>

      {/* Current Balance */}
      <div className="card mb-8 text-center">
        <div className="text-4xl font-bold text-authentiguard-700 mb-2">{currentBalance}</div>
        <div className="text-gray-600">Available Points</div>
        <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500">
          <div>
            <div className="font-semibold text-gray-900">This Month</div>
            <div>+185 points</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">All Time</div>
            <div>+{rewardHistory.reduce((sum, r) => sum + r.amount, 0)} points</div>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rewards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRewards.map(reward => (
            <div key={reward.id} className="card hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-3xl mb-3">{reward.image}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{reward.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-authentiguard-700">
                    {reward.points} pts
                  </span>
                  <button
                    onClick={() => handleRedeemReward(reward)}
                    disabled={currentBalance < reward.points}
                    className={`btn-sm ${
                      currentBalance >= reward.points
                        ? 'btn-primary'
                        : 'btn-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {currentBalance >= reward.points ? 'Redeem' : 'Need More'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map(achievement => {
            const Icon = achievement.icon
            return (
              <div key={achievement.id} className={`card ${achievement.earned ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-6 w-6 ${achievement.earned ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${achievement.earned ? 'text-green-900' : 'text-gray-900'}`}>
                        {achievement.title}
                      </h3>
                      <span className={`text-sm font-medium ${achievement.earned ? 'text-green-600' : 'text-gray-500'}`}>
                        +{achievement.points} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    
                    {!achievement.earned && achievement.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-authentiguard-600 h-2 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {achievement.earned && (
                      <div className="text-xs text-green-600 font-medium">✓ Completed</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {rewardHistory.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getRewardTypeIcon(activity.type)}</div>
                <div>
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">+{activity.amount}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn More */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">How to Earn More Points</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>• Validate authentic products</span>
            <span className="font-medium">5-15 pts</span>
          </div>
          <div className="flex justify-between">
            <span>• Report counterfeit products</span>
            <span className="font-medium">50-100 pts</span>
          </div>
          <div className="flex justify-between">
            <span>• Refer friends to AuthentiGuard</span>
            <span className="font-medium">50 pts</span>
          </div>
          <div className="flex justify-between">
            <span>• Complete achievements</span>
            <span className="font-medium">25-200 pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rewards