import React, { useState, useEffect } from 'react';
import { VerifiWordmark } from '../../assets/verifi-brand';
import AnalyticsDashboard from '../../components/verifi/AnalyticsDashboard';
import BatchManagement from '../../components/verifi/BatchManagement';
import AIInsights from '../../components/verifi/AIInsights';
import { 
  BarChart3, 
  Package, 
  Brain, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';

const VerifiEnterprise = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [manufacturerData, setManufacturerData] = useState({
    company: 'Highland Distillery',
    totalProducts: 125000,
    verifiedToday: 1247,
    counterfeitReports: 23,
    activeDistributors: 45,
    topProducts: [
      { name: 'Highland Reserve 12yr', scans: 3420, authenticity: 98.5 },
      { name: 'Highland Single Malt', scans: 2890, authenticity: 99.1 },
      { name: 'Highland Blend', scans: 2156, authenticity: 97.8 }
    ]
  });

  const tabs = [
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      component: AnalyticsDashboard,
    },
    {
      id: 'batches',
      name: 'Batch Management',
      icon: Package,
      component: BatchManagement,
    },
    {
      id: 'ai',
      name: 'AI Insights',
      icon: Brain,
      component: AIInsights,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <VerifiWordmark size="sm" />
              <span className="ml-4 text-sm font-medium text-gray-500">Enterprise</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{manufacturerData.company}</p>
                <p className="text-xs text-gray-500">Manufacturer Portal</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {manufacturerData.totalProducts.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {manufacturerData.verifiedToday.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Verified Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {manufacturerData.counterfeitReports}
                </p>
                <p className="text-sm text-gray-500">Counterfeit Reports</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {manufacturerData.activeDistributors}
                </p>
                <p className="text-sm text-gray-500">Active Distributors</p>
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
                        ? 'border-blue-500 text-blue-600'
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
                  <Component 
                    manufacturerData={manufacturerData} 
                    setManufacturerData={setManufacturerData} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiEnterprise;