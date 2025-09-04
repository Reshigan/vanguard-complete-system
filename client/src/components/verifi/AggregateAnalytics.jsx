import React, { useState } from 'react';
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
  AreaChart,
  ComposedChart
} from 'recharts';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Building2,
  Shield,
  AlertTriangle,
  Users,
  Package,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const AggregateAnalytics = ({ associationData }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Industry-wide data
  const industryOverview = {
    totalScans: 2847392,
    authenticityRate: 97.8,
    counterfeitRate: 2.2,
    growthRate: 15.3,
    topThreats: ['Geographic clustering', 'Rapid scanning', 'Unusual patterns']
  };

  const manufacturerPerformance = [
    { name: 'Highland Distillery', scans: 125000, authenticity: 98.2, products: 12, risk: 'low' },
    { name: 'Cape Wine Co.', scans: 98000, authenticity: 99.1, products: 18, risk: 'low' },
    { name: 'Johannesburg Spirits', scans: 87000, authenticity: 96.8, products: 8, risk: 'medium' },
    { name: 'Durban Breweries', scans: 76000, authenticity: 98.9, products: 15, risk: 'low' },
    { name: 'Stellenbosch Wines', scans: 65000, authenticity: 97.2, products: 22, risk: 'medium' },
    { name: 'Pretoria Distillers', scans: 54000, authenticity: 94.5, products: 6, risk: 'high' }
  ];

  const regionalData = [
    { province: 'Western Cape', scans: 456000, counterfeits: 8200, manufacturers: 12, growth: 18.5 },
    { province: 'Gauteng', scans: 398000, counterfeits: 9800, manufacturers: 15, growth: 12.3 },
    { province: 'KwaZulu-Natal', scans: 287000, counterfeits: 6400, manufacturers: 8, growth: 22.1 },
    { province: 'Eastern Cape', scans: 156000, counterfeits: 4200, manufacturers: 5, growth: 8.7 },
    { province: 'Free State', scans: 98000, counterfeits: 2100, manufacturers: 3, growth: 15.2 },
    { province: 'Mpumalanga', scans: 87000, counterfeits: 1800, manufacturers: 2, growth: 19.8 },
    { province: 'Limpopo', scans: 76000, counterfeits: 1600, manufacturers: 1, growth: 25.4 },
    { province: 'North West', scans: 65000, counterfeits: 1400, manufacturers: 1, growth: 11.9 },
    { province: 'Northern Cape', scans: 34000, counterfeits: 800, manufacturers: 0, growth: 7.3 }
  ];

  const monthlyTrends = [
    { month: 'Jan', scans: 180000, counterfeits: 3200, authenticity: 98.2 },
    { month: 'Feb', scans: 195000, counterfeits: 3800, authenticity: 98.1 },
    { month: 'Mar', scans: 210000, counterfeits: 4200, authenticity: 98.0 },
    { month: 'Apr', scans: 225000, counterfeits: 4600, authenticity: 97.9 },
    { month: 'May', scans: 240000, counterfeits: 5200, authenticity: 97.8 },
    { month: 'Jun', scans: 255000, counterfeits: 5800, authenticity: 97.7 },
    { month: 'Jul', scans: 270000, counterfeits: 6200, authenticity: 97.7 },
    { month: 'Aug', scans: 285000, counterfeits: 6800, authenticity: 97.6 },
    { month: 'Sep', scans: 298000, counterfeits: 7200, authenticity: 97.6 },
    { month: 'Oct', scans: 312000, counterfeits: 7800, authenticity: 97.5 },
    { month: 'Nov', scans: 328000, counterfeits: 8400, authenticity: 97.4 },
    { month: 'Dec', scans: 345000, counterfeits: 9200, authenticity: 97.3 }
  ];

  const categoryBreakdown = [
    { category: 'Whisky', value: 35.2, scans: 1002000, color: '#8b5cf6' },
    { category: 'Wine', value: 28.7, scans: 817000, color: '#ef4444' },
    { category: 'Beer', value: 18.9, scans: 538000, color: '#f59e0b' },
    { category: 'Brandy', value: 9.8, scans: 279000, color: '#10b981' },
    { category: 'Vodka', value: 4.2, scans: 120000, color: '#3b82f6' },
    { category: 'Other', value: 3.2, scans: 91000, color: '#6b7280' }
  ];

  const COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6b7280'];

  const renderIndustryOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Industry Scans</p>
            <p className="text-2xl font-bold">{industryOverview.totalScans.toLocaleString()}</p>
          </div>
          <Package className="w-8 h-8 text-blue-200" />
        </div>
        <div className="flex items-center mt-2">
          <TrendingUp className="w-4 h-4 text-blue-200 mr-1" />
          <span className="text-blue-100 text-sm">+{industryOverview.growthRate}% this month</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Authenticity Rate</p>
            <p className="text-2xl font-bold">{industryOverview.authenticityRate}%</p>
          </div>
          <Shield className="w-8 h-8 text-green-200" />
        </div>
        <div className="flex items-center mt-2">
          <TrendingUp className="w-4 h-4 text-green-200 mr-1" />
          <span className="text-green-100 text-sm">Industry standard</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm">Counterfeit Rate</p>
            <p className="text-2xl font-bold">{industryOverview.counterfeitRate}%</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-200" />
        </div>
        <div className="flex items-center mt-2">
          <TrendingDown className="w-4 h-4 text-red-200 mr-1" />
          <span className="text-red-100 text-sm">Decreasing trend</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Active Manufacturers</p>
            <p className="text-2xl font-bold">{associationData.totalManufacturers}</p>
          </div>
          <Building2 className="w-8 h-8 text-purple-200" />
        </div>
        <div className="flex items-center mt-2">
          <Users className="w-4 h-4 text-purple-200 mr-1" />
          <span className="text-purple-100 text-sm">Verified members</span>
        </div>
      </div>
    </div>
  );

  const renderMonthlyTrends = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Industry Trends</h3>
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
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'scans' ? value.toLocaleString() : 
                name === 'counterfeits' ? value.toLocaleString() :
                `${value}%`,
                name === 'scans' ? 'Total Scans' :
                name === 'counterfeits' ? 'Counterfeit Reports' :
                'Authenticity Rate'
              ]}
            />
            <Bar yAxisId="left" dataKey="scans" fill="#3b82f6" name="scans" />
            <Bar yAxisId="left" dataKey="counterfeits" fill="#ef4444" name="counterfeits" />
            <Line yAxisId="right" type="monotone" dataKey="authenticity" stroke="#10b981" strokeWidth={3} name="authenticity" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRegionalAnalysis = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Regional Distribution</h3>
          <MapPin className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionalData.slice(0, 5)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="scans"
                label={({ province, scans }) => `${province}: ${(scans/1000).toFixed(0)}k`}
              >
                {regionalData.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Scans']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Provincial Performance</h3>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {regionalData.map((province, index) => (
            <div key={province.province} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{province.province}</p>
                  <p className="text-sm text-gray-500">{province.manufacturers} manufacturers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{province.scans.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{province.growth}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderManufacturerPerformance = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Manufacturer Performance</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Manufacturer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Scans</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Authenticity Rate</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Products</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {manufacturerPerformance.map((manufacturer, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-900">{manufacturer.name}</td>
                <td className="py-3 px-4 text-gray-700">{manufacturer.scans.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{manufacturer.authenticity}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${manufacturer.authenticity}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{manufacturer.products}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    manufacturer.risk === 'low' ? 'bg-green-100 text-green-800' :
                    manufacturer.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {manufacturer.risk.charAt(0).toUpperCase() + manufacturer.risk.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategoryBreakdown = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Category Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ category, value }) => `${category}: ${value}%`}
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          {categoryBreakdown.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-3"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{category.category}</p>
                  <p className="text-sm text-gray-500">{category.scans.toLocaleString()} scans</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{category.value}%</p>
                <p className="text-sm text-gray-500">Market share</p>
              </div>
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
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Regions</option>
            <option value="western-cape">Western Cape</option>
            <option value="gauteng">Gauteng</option>
            <option value="kzn">KwaZulu-Natal</option>
          </select>
        </div>
        <button className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Export Industry Report
        </button>
      </div>

      {/* Content */}
      {renderIndustryOverview()}
      {renderMonthlyTrends()}
      {renderRegionalAnalysis()}
      {renderManufacturerPerformance()}
      {renderCategoryBreakdown()}
    </div>
  );
};

export default AggregateAnalytics;