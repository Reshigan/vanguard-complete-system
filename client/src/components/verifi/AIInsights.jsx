import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  MapPin,
  Network,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const AIInsights = ({ manufacturerData }) => {
  const [activeInsight, setActiveInsight] = useState('anomalies');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // AI-generated insights data
  const anomalyDetection = {
    criticalAlerts: 3,
    mediumAlerts: 7,
    lowAlerts: 12,
    anomalies: [
      {
        id: 1,
        type: 'geographic',
        severity: 'critical',
        title: 'Unusual Geographic Clustering',
        description: 'Highland Reserve 12yr tokens showing abnormal concentration in Lagos, Nigeria',
        confidence: 94.2,
        affectedTokens: 47,
        recommendation: 'Investigate distributor "Metro Spirits" supply chain immediately',
        timestamp: '2024-02-15 09:30:00',
        status: 'active'
      },
      {
        id: 2,
        type: 'temporal',
        severity: 'medium',
        title: 'Rapid Scan Pattern',
        description: 'Multiple tokens from batch HS-2024-002 scanned within 2-hour window',
        confidence: 87.6,
        affectedTokens: 23,
        recommendation: 'Monitor retailer "Coastal Trading" for bulk verification activity',
        timestamp: '2024-02-14 16:45:00',
        status: 'investigating'
      },
      {
        id: 3,
        type: 'behavioral',
        severity: 'low',
        title: 'Consumer Scan Frequency',
        description: 'Single consumer account scanning 15+ products in one day',
        confidence: 72.3,
        affectedTokens: 15,
        recommendation: 'Review consumer account for potential commercial use',
        timestamp: '2024-02-14 11:20:00',
        status: 'resolved'
      }
    ]
  };

  const trendAnalysis = {
    predictions: [
      {
        metric: 'Counterfeit Risk',
        current: 1.8,
        predicted: 2.3,
        timeframe: '30 days',
        confidence: 89.4,
        trend: 'increasing',
        factors: ['Holiday season approaching', 'New distributor onboarding', 'Price increase announced']
      },
      {
        metric: 'Scan Volume',
        current: 1284,
        predicted: 1456,
        timeframe: '7 days',
        confidence: 92.1,
        trend: 'increasing',
        factors: ['Marketing campaign launch', 'Seasonal demand', 'New retail partnerships']
      },
      {
        metric: 'Geographic Expansion',
        current: 9,
        predicted: 11,
        timeframe: '60 days',
        confidence: 76.8,
        trend: 'stable',
        factors: ['Export license pending', 'Distributor negotiations', 'Regulatory approvals']
      }
    ],
    insights: [
      'Western Cape showing 23% increase in scan activity',
      'Premium products outperforming blend categories by 15%',
      'Weekend scan patterns suggest retail-focused distribution',
      'Mobile app adoption rate 34% higher than web platform'
    ]
  };

  const distributionAnalysis = {
    riskScores: [
      { distributor: 'Premium Liquors', score: 12, risk: 'low', factors: ['High authenticity rate', 'Consistent reporting'] },
      { distributor: 'City Distributors', score: 28, risk: 'low', factors: ['Good geographic coverage', 'Regular audits'] },
      { distributor: 'Regional Wines', score: 45, risk: 'medium', factors: ['Delayed reporting', 'Geographic anomalies'] },
      { distributor: 'Metro Spirits', score: 78, risk: 'high', factors: ['Multiple red flags', 'Unusual scan patterns'] },
      { distributor: 'Coastal Trading', score: 34, risk: 'medium', factors: ['New partnership', 'Limited history'] }
    ],
    networkAnalysis: {
      totalNodes: 156,
      suspiciousConnections: 8,
      isolatedClusters: 3,
      centralityScore: 0.73
    },
    recommendations: [
      'Increase monitoring frequency for Metro Spirits',
      'Conduct physical audit of Regional Wines warehouse',
      'Implement additional verification steps for new distributors',
      'Review pricing strategy for premium products'
    ]
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
    setLastUpdated(new Date());
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderAnomalyDetection = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-red-700">{anomalyDetection.criticalAlerts}</p>
              <p className="text-sm text-red-600">Critical Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-yellow-700">{anomalyDetection.mediumAlerts}</p>
              <p className="text-sm text-yellow-600">Medium Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{anomalyDetection.lowAlerts}</p>
              <p className="text-sm text-blue-600">Low Priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {anomalyDetection.anomalies.map((anomaly) => (
          <div key={anomaly.id} className={`bg-white rounded-lg border p-6 ${getSeverityColor(anomaly.severity)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 mr-3">{anomaly.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.severity.toUpperCase()}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {anomaly.confidence}% confidence
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{anomaly.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Target className="w-4 h-4 mr-1" />
                  {anomaly.affectedTokens} tokens affected
                  <span className="mx-2">•</span>
                  {new Date(anomaly.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  anomaly.status === 'active' ? 'bg-red-100 text-red-800' :
                  anomaly.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {anomaly.status}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">AI Recommendation:</h5>
              <p className="text-gray-700">{anomaly.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrendAnalysis = () => (
    <div className="space-y-6">
      {/* Predictions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Predictive Analytics</h3>
        <div className="grid gap-6">
          {trendAnalysis.predictions.map((prediction, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{prediction.metric}</h4>
                <div className="flex items-center">
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    prediction.trend === 'increasing' ? 'text-green-500' :
                    prediction.trend === 'decreasing' ? 'text-red-500' :
                    'text-gray-500'
                  }`} />
                  <span className="text-sm text-gray-500">{prediction.confidence}% confidence</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{prediction.current}</p>
                  <p className="text-sm text-gray-500">Current</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{prediction.predicted}</p>
                  <p className="text-sm text-gray-500">Predicted</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700">{prediction.timeframe}</p>
                  <p className="text-sm text-gray-500">Timeframe</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Key Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {prediction.factors.map((factor, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendAnalysis.insights.map((insight, index) => (
            <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
              <p className="text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDistributionAnalysis = () => (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Network className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{distributionAnalysis.networkAnalysis.totalNodes}</p>
          <p className="text-sm text-gray-500">Network Nodes</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{distributionAnalysis.networkAnalysis.suspiciousConnections}</p>
          <p className="text-sm text-gray-500">Suspicious Links</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Target className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{distributionAnalysis.networkAnalysis.isolatedClusters}</p>
          <p className="text-sm text-gray-500">Isolated Clusters</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{distributionAnalysis.networkAnalysis.centralityScore}</p>
          <p className="text-sm text-gray-500">Centrality Score</p>
        </div>
      </div>

      {/* Risk Scores */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Distributor Risk Assessment</h3>
        <div className="space-y-4">
          {distributionAnalysis.riskScores.map((distributor, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{distributor.distributor}</h4>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-900">{distributor.score}</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(distributor.risk)}`}>
                    {distributor.risk.toUpperCase()} RISK
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    distributor.risk === 'high' ? 'bg-red-500' :
                    distributor.risk === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${distributor.score}%` }}
                ></div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {distributor.factors.map((factor, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          {distributionAnalysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
              <Brain className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
              <p className="text-green-800">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'anomalies', name: 'Anomaly Detection', icon: AlertTriangle },
              { id: 'trends', name: 'Trend Analysis', icon: TrendingUp },
              { id: 'distribution', name: 'Distribution Analysis', icon: Network }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveInsight(tab.id)}
                  className={`flex items-center py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                    activeInsight === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>
        </div>
      </div>

      {/* Content */}
      {activeInsight === 'anomalies' && renderAnomalyDetection()}
      {activeInsight === 'trends' && renderTrendAnalysis()}
      {activeInsight === 'distribution' && renderDistributionAnalysis()}

      {/* AI Status */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-blue-500 mr-2" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">AI Analysis Engine Status</p>
            <p className="text-xs text-gray-600">
              Processing {manufacturerData.totalProducts.toLocaleString()} products across {manufacturerData.activeDistributors} distributors
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;