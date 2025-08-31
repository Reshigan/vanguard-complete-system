import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Package, Users, Shield, AlertCircle, Map, Filter,
  Download, RefreshCw, Calendar, ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import ChatAssistant from '../AI/ChatAssistant';

const ManufacturerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');
  const [activeSection, setActiveSection] = useState('overview');
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/analytics/manufacturer/dashboard?timeframe=${timeframe}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    // In production, implement CSV/PDF export
    alert('Exporting dashboard data...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  const { overview, channels, complaints, supplyChain, predictions, alerts } = dashboardData;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manufacturer Analytics</h1>
              <p className="text-sm text-gray-500">Real-time insights and supply chain intelligence</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => fetchDashboardData()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={exportData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowChatAssistant(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Bar */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                View All →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-sm font-medium ${
                overview.validations.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overview.validations.change > 0 ? '+' : ''}{overview.validations.change.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{overview.validations.total.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Total Validations</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className={`text-sm font-medium ${
                overview.counterfeits.change < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overview.counterfeits.change > 0 ? '+' : ''}{overview.counterfeits.change.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{overview.counterfeits.total}</h3>
            <p className="text-sm text-gray-500">Counterfeit Reports</p>
            <p className="text-xs text-gray-400 mt-1">{overview.counterfeits.rate.toFixed(2)}% rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className={`text-sm font-medium ${
                overview.users.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overview.users.change > 0 ? '+' : ''}{overview.users.change.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{overview.users.active.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Active Users</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-green-600">Protected</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${overview.revenue.protected.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Revenue Protected</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 mb-6 border-b">
          {['overview', 'channels', 'complaints', 'supply-chain', 'predictions'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeSection === section
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {section.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Section Content */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Validation Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={channels.trends.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="validations" stroke="#3B82F6" name="Validations" />
                  <Line type="monotone" dataKey="counterfeits" stroke="#EF4444" name="Counterfeits" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(channels.geographic).map(([country, data]) => ({
                      name: country,
                      value: data.validations
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(channels.geographic).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Predictive Insights */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Predictive Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Counterfeit Risk</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      predictions.predictions.counterfeit_risk.current_risk === 'high'
                        ? 'bg-red-100 text-red-700'
                        : predictions.predictions.counterfeit_risk.current_risk === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {predictions.predictions.counterfeit_risk.current_risk}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {predictions.predictions.counterfeit_risk.forecast_30_days}
                  </p>
                  <p className="text-xs text-gray-500">Expected in next 30 days</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Demand Forecast</span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">
                    {predictions.predictions.demand_forecast.next_30_days.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Validations expected</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">High Risk Channels</span>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold">
                    {predictions.predictions.channel_risk_evolution.high_risk_channels}
                  </p>
                  <p className="text-xs text-gray-500">Require attention</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'channels' && (
          <div className="space-y-6">
            {/* Channel Risk Matrix */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Channel Risk Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(channels.channels).map(([riskLevel, channelList]) => (
                  <div key={riskLevel} className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${
                      riskLevel === 'high_risk' ? 'text-red-600' :
                      riskLevel === 'medium_risk' ? 'text-yellow-600' :
                      riskLevel === 'low_risk' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {channelList.length}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{riskLevel.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>

              {/* High Risk Channels Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counterfeit Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {channels.channels.high_risk.slice(0, 5).map((channel) => (
                      <tr key={channel.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{channel.channel_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{channel.address || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${channel.trust_score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{(channel.trust_score * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                          {channel.counterfeit_rate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => setSelectedChannel(channel)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Channel Performance Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Channel Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[...channels.channels.high_risk, ...channels.channels.medium_risk].slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="validations" fill="#3B82F6" name="Validations" />
                  <Bar dataKey="counterfeits" fill="#EF4444" name="Counterfeits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === 'complaints' && (
          <div className="space-y-6">
            {/* Complaints Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Complaint Categories</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(complaints.categorization.by_type).map(([type, count]) => ({
                        name: type,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(complaints.categorization.by_type).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {Object.entries(complaints.categorization.by_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Positive</span>
                      <span className="text-sm font-medium">{complaints.sentiment.positive}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(complaints.sentiment.positive / complaints.summary.total_complaints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Neutral</span>
                      <span className="text-sm font-medium">{complaints.sentiment.neutral}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(complaints.sentiment.neutral / complaints.summary.total_complaints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Negative</span>
                      <span className="text-sm font-medium">{complaints.sentiment.negative}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(complaints.sentiment.negative / complaints.summary.total_complaints) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Sentiment Score</p>
                  <p className="text-2xl font-bold">{complaints.sentiment.average_sentiment.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Resolution Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-3xl font-bold text-green-600">
                      {complaints.summary.resolution_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Resolution Time</p>
                    <p className="text-2xl font-bold">
                      {complaints.resolution.average_resolution_time.toFixed(1)} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Critical</p>
                    <p className="text-2xl font-bold text-red-600">
                      {complaints.resolution.pending_critical}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Themes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Common Complaint Themes</h3>
              <div className="space-y-3">
                {complaints.themes.map((theme, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{theme.theme}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${theme.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {theme.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'supply-chain' && (
          <div className="space-y-6">
            {/* Supply Chain Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Validation Rate</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {supplyChain.metrics.validation_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Of produced items validated</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Time to Market</h3>
                <p className="text-3xl font-bold text-green-600">
                  {supplyChain.metrics.average_time_to_market.toFixed(1)} days
                </p>
                <p className="text-xs text-gray-500 mt-1">From production to validation</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Authenticity Rate</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {supplyChain.metrics.authenticity_verification_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Verified authentic</p>
              </div>
            </div>

            {/* Batch Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Batch Performance Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {supplyChain.metrics.batch_performance.slice(0, 5).map((batch) => (
                      <tr key={batch.batch_number} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{batch.batch_number}</td>
                        <td className="px-4 py-3 text-sm">{batch.total_tokens}</td>
                        <td className="px-4 py-3 text-sm">{batch.validated}</td>
                        <td className="px-4 py-3 text-sm text-red-600">{batch.reported}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${batch.performance_score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{(batch.performance_score * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supply Chain Flow Visualization */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Supply Chain Flow</h3>
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Supply chain flow visualization would go here</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'predictions' && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">AI-Powered Recommendations</h3>
              <div className="space-y-4">
                {predictions.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                            rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-sm text-gray-500">Timeline: {rec.timeline}</span>
                        </div>
                        <h4 className="font-medium mb-1">{rec.action}</h4>
                        <p className="text-sm text-gray-600">Expected Impact: {rec.expected_impact}</p>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        Take Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Patterns */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Seasonal Patterns</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={predictions.predictions.seasonal_patterns.peak_months.map(month => ({
                  month: new Date(2024, month.month).toLocaleString('default', { month: 'short' }),
                  validations: month.avg_validations,
                  risk: month.risk_level
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="month" />
                  <PolarRadiusAxis />
                  <Radar name="Validations" dataKey="validations" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Radar name="Risk Level" dataKey="risk" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Assistant */}
      <ChatAssistant
        isOpen={showChatAssistant}
        onClose={() => setShowChatAssistant(false)}
        sessionType="analytics"
      />

      {/* Channel Investigation Modal */}
      {selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Channel Investigation: {selectedChannel.channel_name}</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Trust Score</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(selectedChannel.trust_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Counterfeit Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedChannel.counterfeit_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Risk Factors</h3>
                <ul className="space-y-2">
                  {selectedChannel.risk_factors.map((factor, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className={`w-4 h-4 mr-2 mt-0.5 ${
                        factor.severity === 'critical' ? 'text-red-600' :
                        factor.severity === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <span className="text-sm">{factor.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recommended Actions</h3>
                <div className="space-y-2">
                  {selectedChannel.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{rec.description}</span>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Execute
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerDashboard;