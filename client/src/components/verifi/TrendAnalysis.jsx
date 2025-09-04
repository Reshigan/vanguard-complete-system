import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Network, 
  Brain, 
  Target, 
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  Zap,
  Eye,
  Download,
  Settings
} from 'lucide-react';

const TrendAnalysis = ({ associationData }) => {
  const [analysisType, setAnalysisType] = useState('predictive');
  const [timeHorizon, setTimeHorizon] = useState('30d');

  // Cross-manufacturer trend data
  const crossManufacturerTrends = [
    { 
      date: '2024-01-01', 
      totalScans: 15420, 
      counterfeitRate: 2.1, 
      networkDensity: 0.73,
      suspiciousActivity: 12 
    },
    { 
      date: '2024-01-08', 
      totalScans: 16890, 
      counterfeitRate: 2.3, 
      networkDensity: 0.75,
      suspiciousActivity: 15 
    },
    { 
      date: '2024-01-15', 
      totalScans: 18240, 
      counterfeitRate: 2.0, 
      networkDensity: 0.78,
      suspiciousActivity: 9 
    },
    { 
      date: '2024-01-22', 
      totalScans: 19560, 
      counterfeitRate: 2.4, 
      networkDensity: 0.81,
      suspiciousActivity: 18 
    },
    { 
      date: '2024-01-29', 
      totalScans: 20890, 
      counterfeitRate: 2.2, 
      networkDensity: 0.83,
      suspiciousActivity: 14 
    },
    { 
      date: '2024-02-05', 
      totalScans: 22150, 
      counterfeitRate: 2.6, 
      networkDensity: 0.85,
      suspiciousActivity: 21 
    },
    { 
      date: '2024-02-12', 
      totalScans: 23420, 
      counterfeitRate: 2.8, 
      networkDensity: 0.87,
      suspiciousActivity: 25 
    }
  ];

  // Network analysis data
  const networkConnections = [
    { 
      source: 'Highland Distillery', 
      target: 'Premium Liquors', 
      strength: 0.89, 
      risk: 'low',
      transactions: 1240 
    },
    { 
      source: 'Cape Wine Co.', 
      target: 'City Distributors', 
      strength: 0.76, 
      risk: 'low',
      transactions: 980 
    },
    { 
      source: 'Johannesburg Spirits', 
      target: 'Metro Spirits', 
      strength: 0.92, 
      risk: 'high',
      transactions: 1560 
    },
    { 
      source: 'Durban Breweries', 
      target: 'Regional Wines', 
      strength: 0.68, 
      risk: 'medium',
      transactions: 720 
    },
    { 
      source: 'Stellenbosch Wines', 
      target: 'Coastal Trading', 
      strength: 0.84, 
      risk: 'medium',
      transactions: 890 
    }
  ];

  // Predictive policing data
  const predictiveHotspots = [
    {
      location: 'Lagos, Nigeria',
      riskScore: 94.2,
      predictedIncidents: 23,
      confidence: 89.4,
      factors: ['Geographic clustering', 'Unusual scan patterns', 'Cross-border activity'],
      timeframe: '14 days'
    },
    {
      location: 'Johannesburg CBD',
      riskScore: 78.6,
      predictedIncidents: 12,
      confidence: 76.8,
      factors: ['High distributor density', 'Price anomalies', 'Rapid scanning'],
      timeframe: '21 days'
    },
    {
      location: 'Cape Town Waterfront',
      riskScore: 65.3,
      predictedIncidents: 8,
      confidence: 82.1,
      factors: ['Tourist area', 'Multiple retailers', 'Seasonal patterns'],
      timeframe: '30 days'
    },
    {
      location: 'Durban Harbor',
      riskScore: 71.9,
      predictedIncidents: 15,
      confidence: 73.5,
      factors: ['Import/export hub', 'Transit activity', 'Storage facilities'],
      timeframe: '18 days'
    }
  ];

  // Graph analysis results
  const graphAnalysis = {
    totalNodes: 247,
    totalEdges: 1834,
    clusters: 12,
    suspiciousSubgraphs: 4,
    centralityScores: [
      { entity: 'Metro Spirits', centrality: 0.94, type: 'distributor', risk: 'high' },
      { entity: 'Highland Distillery', centrality: 0.87, type: 'manufacturer', risk: 'low' },
      { entity: 'Premium Liquors', centrality: 0.82, type: 'distributor', risk: 'low' },
      { entity: 'Cape Wine Co.', centrality: 0.79, type: 'manufacturer', risk: 'low' },
      { entity: 'Regional Wines', centrality: 0.73, type: 'distributor', risk: 'medium' }
    ],
    anomalousPatterns: [
      'Circular transaction patterns detected in Cluster 7',
      'Unusual geographic distribution in Cluster 3',
      'Rapid connection formation in Cluster 11',
      'Isolated high-volume nodes in Cluster 2'
    ]
  };

  const renderPredictiveAnalysis = () => (
    <div className="space-y-6">
      {/* Trend Predictions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cross-Manufacturer Trends</h3>
          <div className="flex items-center space-x-3">
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={crossManufacturerTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'totalScans' ? value.toLocaleString() :
                  name === 'counterfeitRate' ? `${value}%` :
                  name === 'networkDensity' ? value.toFixed(2) :
                  value,
                  name === 'totalScans' ? 'Total Scans' :
                  name === 'counterfeitRate' ? 'Counterfeit Rate' :
                  name === 'networkDensity' ? 'Network Density' :
                  'Suspicious Activity'
                ]}
              />
              <Bar yAxisId="left" dataKey="totalScans" fill="#3b82f6" opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="counterfeitRate" stroke="#ef4444" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="networkDensity" stroke="#10b981" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="suspiciousActivity" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictive Hotspots */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Predictive Policing Hotspots</h3>
          <Target className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="grid gap-4">
          {predictiveHotspots.map((hotspot, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-red-500 mr-2" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{hotspot.location}</h4>
                    <p className="text-sm text-gray-500">Risk assessment in {hotspot.timeframe}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-red-600 mr-2">{hotspot.riskScore}</span>
                    <div className="text-sm text-gray-500">
                      <p>Risk Score</p>
                      <p>{hotspot.confidence}% confidence</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{hotspot.predictedIncidents}</p>
                  <p className="text-sm text-red-600">Predicted Incidents</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{hotspot.confidence}%</p>
                  <p className="text-sm text-blue-600">AI Confidence</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {hotspot.factors.map((factor, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGraphAnalysis = () => (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Network className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{graphAnalysis.totalNodes}</p>
          <p className="text-sm text-gray-500">Total Nodes</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{graphAnalysis.totalEdges}</p>
          <p className="text-sm text-gray-500">Connections</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{graphAnalysis.clusters}</p>
          <p className="text-sm text-gray-500">Clusters</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{graphAnalysis.suspiciousSubgraphs}</p>
          <p className="text-sm text-gray-500">Suspicious</p>
        </div>
      </div>

      {/* Centrality Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Network Centrality Analysis</h3>
        <div className="space-y-4">
          {graphAnalysis.centralityScores.map((entity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  entity.type === 'manufacturer' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div>
                  <p className="font-semibold text-gray-900">{entity.entity}</p>
                  <p className="text-sm text-gray-500 capitalize">{entity.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{entity.centrality}</p>
                  <p className="text-sm text-gray-500">Centrality Score</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  entity.risk === 'low' ? 'bg-green-100 text-green-800' :
                  entity.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {entity.risk.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Connections */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Network Connections</h3>
        <div className="space-y-4">
          {networkConnections.map((connection, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{connection.source}</span>
                    <div className="mx-3 flex items-center">
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                    </div>
                    <span className="font-medium text-gray-900">{connection.target}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  connection.risk === 'low' ? 'bg-green-100 text-green-800' :
                  connection.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {connection.risk.toUpperCase()} RISK
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Connection Strength</p>
                  <div className="flex items-center mt-1">
                    <span className="text-lg font-bold text-gray-900 mr-2">{connection.strength}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${connection.strength * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-lg font-bold text-gray-900">{connection.transactions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalous Patterns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Anomalous Network Patterns</h3>
        <div className="space-y-3">
          {graphAnalysis.anomalousPatterns.map((pattern, index) => (
            <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <Brain className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <p className="text-yellow-800">{pattern}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeSeriesAnalysis = () => (
    <div className="space-y-6">
      {/* Temporal Patterns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Temporal Pattern Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crossManufacturerTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'suspiciousActivity' ? value : `${value}%`,
                  name === 'suspiciousActivity' ? 'Suspicious Events' : 'Counterfeit Rate'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="counterfeitRate" 
                stackId="1"
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="suspiciousActivity" 
                stackId="2"
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cross-Variable Correlation</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={crossManufacturerTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="networkDensity" name="Network Density" />
              <YAxis dataKey="counterfeitRate" name="Counterfeit Rate" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'counterfeitRate' ? `${value}%` : value,
                  name === 'counterfeitRate' ? 'Counterfeit Rate' : 'Network Density'
                ]}
              />
              <Scatter dataKey="counterfeitRate" fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'predictive', name: 'Predictive Analysis', icon: Brain },
            { id: 'graph', name: 'Graph Analysis', icon: Network },
            { id: 'temporal', name: 'Temporal Analysis', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAnalysisType(tab.id)}
                className={`flex items-center py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                  analysisType === tab.id
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
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>
        </div>
      </div>

      {/* Content */}
      {analysisType === 'predictive' && renderPredictiveAnalysis()}
      {analysisType === 'graph' && renderGraphAnalysis()}
      {analysisType === 'temporal' && renderTimeSeriesAnalysis()}

      {/* AI Status */}
      <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center">
          <Zap className="w-5 h-5 text-purple-500 mr-2" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">Advanced Analytics Engine</p>
            <p className="text-xs text-purple-700">
              Processing cross-manufacturer data from {associationData.totalManufacturers} members
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-purple-600 font-medium">Analyzing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;