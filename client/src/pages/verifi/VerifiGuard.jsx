import React, { useState, useEffect } from 'react';
import { VerifiWordmark, VerifiBrand } from '../../assets/verifi-brand.jsx';
import NFCScanner from '../../components/verifi/NFCScanner';
import RewardsProgram from '../../components/verifi/RewardsProgram';
import ResponsibleDrinking from '../../components/verifi/ResponsibleDrinking';
import { Smartphone, Award, Heart, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const VerifiGuard = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [user, setUser] = useState({
    name: 'John Doe',
    points: 1250,
    tier: 'Silver',
    scansToday: 3,
    totalScans: 47,
    counterfeitReports: 2,
  });

  const tabs = [
    {
      id: 'scanner',
      name: 'Verify',
      icon: Smartphone,
      component: NFCScanner,
    },
    {
      id: 'rewards',
      name: 'Rewards',
      icon: Award,
      component: RewardsProgram,
    },
    {
      id: 'responsible',
      name: 'Drink Safe',
      icon: Heart,
      component: ResponsibleDrinking,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <VerifiWordmark size="sm" />
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.tier} • {user.points} pts</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.totalScans}</p>
                <p className="text-sm text-gray-500">Total Scans</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.points}</p>
                <p className="text-sm text-gray-500">Points</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.counterfeitReports}</p>
                <p className="text-sm text-gray-500">Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {tabs.map((tab) => {
              const Component = tab.component;
              return (
                <div
                  key={tab.id}
                  className={activeTab === tab.id ? 'block' : 'hidden'}
                >
                  <Component user={user} setUser={setUser} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiGuard;