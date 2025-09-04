import React, { useState } from 'react';
import { VerifiWordmark } from '../../assets/verifi-brand';
import AggregateAnalytics from '../../components/verifi/AggregateAnalytics';
import TrendAnalysis from '../../components/verifi/TrendAnalysis';
import InterventionManagement from '../../components/verifi/InterventionManagement';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Globe, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Building2
} from 'lucide-react';

const VerifiIntelligence = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [associationData, setAssociationData] = useState({
    organization: 'South African Liquor Industry Association',
    totalManufacturers: 47,
    totalProducts: 2850000,
    totalScansToday: 18420,
    counterfeitReports: 156,
    activeInvestigations: 12,
    resolvedCases: 89,
    memberManufacturers: [
      'Highland Distillery', 'Cape Wine Co.', 'Johannesburg Spirits', 
      'Durban Breweries', 'Stellenbosch Wines', 'Pretoria Distillers'
    ]
  });

  const tabs = [
    {
      id: 'analytics',
      name: 'Industry Analytics',
      icon: BarChart3,
      component: AggregateAnalytics,
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      icon: TrendingUp,
      component: TrendAnalysis,
    },
    {
      id: 'interventions',
      name: 'Interventions',
      icon: Shield,
      component: InterventionManagement,
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
              <span className="ml-4 text-sm font-medium text-gray-500">Intelligence</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">SALIA Portal</p>
                <p className="text-xs text-gray-500">Industry Association</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Industry Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {associationData.totalManufacturers}
                </p>
                <p className="text-sm text-gray-500">Member Manufacturers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {associationData.totalProducts.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Protected Products</p>
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
                  {associationData.totalScansToday.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Scans Today</p>
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
                  {associationData.activeInvestigations}
                </p>
                <p className="text-sm text-gray-500">Active Cases</p>
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
                        ? 'border-purple-500 text-purple-600'
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
                    associationData={associationData} 
                    setAssociationData={setAssociationData} 
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

export default VerifiIntelligence;