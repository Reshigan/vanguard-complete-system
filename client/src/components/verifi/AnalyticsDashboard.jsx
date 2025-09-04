import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  Globe,
  BarChart3
} from 'lucide-react';

const AnalyticsDashboard = ({ manufacturerData }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('scans');
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for charts
  const scanTrendData = [
    { date: '2024-01-01', scans: 1200, authentic: 1176, counterfeit: 24 },
    { date: '2024-01-02', scans: 1350, authentic: 1323, counterfeit: 27 },
    { date: '2024-01-03', scans: 1180, authentic: 1156, counterfeit: 24 },
    { date: '2024-01-04', scans: 1420, authentic: 1391, counterfeit: 29 },
    { date: '2024-01-05', scans: 1380, authentic: 1352, counterfeit: 28 },
    { date: '2024-01-06', scans: 1290, authentic: 1264, counterfeit: 26 },
    { date: '2024-01-07', scans: 1247, authentic: 1221, counterfeit: 26 }
  ];

  const geographicData = [
    { province: 'Western Cape', scans: 3420, percentage: 28.5 },
    { province: 'Gauteng', scans: 3180, percentage: 26.4 },
    { province: 'KwaZulu-Natal', scans: 2890, percentage: 24.1 },
    { province: 'Eastern Cape', scans: 1560, percentage: 13.0 },
    { province: 'Free State', scans: 980, percentage: 8.0 }
  ];

  const productPerformanceData = [
    { name: 'Highland Reserve 12yr', scans: 3420, authenticity: 98.5, revenue: 125000 },
    { name: 'Highland Single Malt', scans: 2890, authenticity: 99.1, revenue: 98000 },
    { name: 'Highland Blend', scans: 2156, authenticity: 97.8, revenue: 76000 },
    { name: 'Highland Premium', scans: 1890, authenticity: 98.9, revenue: 89000 },
    { name: 'Highland Classic', scans: 1654, authenticity: 97.2, revenue: 54000 }
  ];

  const distributorData = [
    { name: 'Premium Liquors', scans: 2340, authenticity: 99.2, risk: 'low' },
    { name: 'City Distributors', scans: 1890, authenticity: 98.7, risk: 'low' },
    { name: 'Regional Wines', scans: 1560, authenticity: 96.8, risk: 'medium' },
    { name: 'Metro Spirits', scans: 1234, authenticity: 94.2, risk: 'high' },
    { name: 'Coastal Trading', scans: 987, authenticity: 98.1, risk: 'low' }
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const exportData = () => {
    // In a real app, this would generate and download a report
    alert('Analytics report exported successfully!');
  };

  const renderKPICards = () => {
    const kpis = [
      {
        title: 'Authenticity Rate',
        value: '98.2%',
        change: '+0.3%',
        trend: 'up',
        color: 'green'
      },
      {
        title: 'Avg Daily Scans',
        value: '1,284',
        change: '+12.5%',
        trend: 'up',
        color: 'blue'
      },
      {
        title: 'Counterfeit Rate',
        value: '1.8%',
        change: '-0.3%',
        trend: 'down',
        color: 'red'
      },
      {
        title: 'Geographic Coverage',
        value: '9/9',
        change: '100%',
        trend: 'stable',
        color: 'purple'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`flex items-center text-sm ${
                kpi.trend === 'up' ? 'text-green-600' : 
                kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {kpi.trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                {kpi.trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="font-medium">{kpi.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderScanTrends = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Scan Trends</h3>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={scanTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
            <Area 
              type="monotone" 
              dataKey="authentic" 
              stackId="1"
              stroke="#22c55e" 
              fill="#22c55e" 
              fillOpacity={0.6}
              name="Authentic Scans"
            />
            <Area 
              type="monotone" 
              dataKey="counterfeit" 
              stackId="1"
              stroke="#ef4444" 
              fill="#ef4444" 
              fillOpacity={0.6}
              name="Counterfeit Reports"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderGeographicDistribution = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
        <MapPin className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={geographicData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="scans"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {geographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Scans']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          {geographicData.map((province, index) => (
            <div key={province.province} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="font-medium text-gray-900">{province.province}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{province.scans.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{province.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProductPerformance = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
        <BarChart3 className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={productPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'scans' ? value.toLocaleString() : 
                name === 'authenticity' ? `${value}%` :
                `R${value.toLocaleString()}`,
                name === 'scans' ? 'Scans' :
                name === 'authenticity' ? 'Authenticity Rate' :
                'Revenue'
              ]}
            />
            <Bar dataKey="scans" fill="#3b82f6" name="scans" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDistributorAnalysis = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Distributor Risk Analysis</h3>
        <Globe className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Distributor</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Scans</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Authenticity Rate</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {distributorData.map((distributor, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-900">{distributor.name}</td>
                <td className="py-3 px-4 text-gray-700">{distributor.scans.toLocaleString()}</td>
                <td className="py-3 px-4 text-gray-700">{distributor.authenticity}%</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    distributor.risk === 'low' ? 'bg-green-100 text-green-800' :
                    distributor.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {distributor.risk.charAt(0).toUpperCase() + distributor.risk.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="scans">Scans</option>
              <option value="authenticity">Authenticity</option>
              <option value="geographic">Geographic</option>
              <option value="products">Products</option>
            </select>
          </div>
        </div>
        <button
          onClick={exportData}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Charts */}
      {renderScanTrends()}
      {renderGeographicDistribution()}
      {renderProductPerformance()}
      {renderDistributorAnalysis()}
    </div>
  );
};

export default AnalyticsDashboard;