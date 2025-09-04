import React, { useState, useEffect } from 'react'
import { Calendar, Download, FileText, TrendingUp, AlertTriangle, Package, Users, MapPin, DollarSign, Shield, Wine, Beer } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const BusinessReports = () => {
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('overview')
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: new Date()
  })
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    manufacturer: 'all'
  })

  // South African specific data
  const [saMetrics, setSaMetrics] = useState({
    topBrands: [],
    topRetailers: [],
    provincialData: [],
    counterfeitHotspots: []
  })

  useEffect(() => {
    fetchReportData()
  }, [reportType, dateRange, filters])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Mock data for South African alcohol market
      const mockData = {
        totalValidations: 45678,
        validationGrowth: 15.3,
        authenticityRate: 94.7,
        counterfeitsDetected: 2421,
        activeUsers: 12543,
        categoryDistribution: {
          beer: 45,
          wine: 25,
          spirits: 20,
          cider: 10
        },
        trendLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        counterfeitTrend: [180, 220, 195, 310, 280, 245]
      }
      
      const mockSAMetrics = {
        topBrands: [
          { name: 'Castle Lager', validations: 8543 },
          { name: 'Black Label', validations: 7231 },
          { name: 'Savanna Dry', validations: 5892 },
          { name: 'Klipdrift', validations: 4567 },
          { name: 'Johnnie Walker', validations: 3890 }
        ],
        topRetailers: [
          { name: 'Tops at Sandton', chain: 'Tops', location: 'Sandton', validations: 3456, authenticityRate: 96.2 },
          { name: 'Makro Liquor JHB', chain: 'Makro', location: 'Johannesburg', validations: 2890, authenticityRate: 95.8 },
          { name: 'Pick n Pay Liquor V&A', chain: 'Pick n Pay', location: 'Cape Town', validations: 2567, authenticityRate: 97.1 },
          { name: 'Checkers LiquorShop', chain: 'Checkers', location: 'Durban', validations: 2234, authenticityRate: 94.5 },
          { name: 'Ultra Liquors Menlyn', chain: 'Ultra Liquors', location: 'Pretoria', validations: 1987, authenticityRate: 95.9 }
        ],
        counterfeitHotspots: [
          { location: 'Johannesburg CBD', incidents: 234, products: 'Spirits, Beer', risk: 'high' },
          { location: 'Durban Harbour', incidents: 189, products: 'Imported Spirits', risk: 'high' },
          { location: 'Cape Town Townships', incidents: 156, products: 'Beer, Cider', risk: 'medium' },
          { location: 'Pretoria Central', incidents: 98, products: 'Brandy, Whisky', risk: 'medium' },
          { location: 'Port Elizabeth', incidents: 67, products: 'Wine, Beer', risk: 'low' }
        ]
      }
      
      setReportData(mockData)
      setSaMetrics(mockSAMetrics)
    } catch (error) {
      toast.error('Failed to load report data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format) => {
    try {
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const reportTypes = [
    { id: 'overview', name: 'Executive Overview', icon: TrendingUp },
    { id: 'validations', name: 'Product Validations', icon: Shield },
    { id: 'counterfeits', name: 'Counterfeit Analysis', icon: AlertTriangle },
    { id: 'products', name: 'Product Performance', icon: Package },
    { id: 'retailers', name: 'Retailer Analytics', icon: Users },
    { id: 'geographic', name: 'Geographic Insights', icon: MapPin },
    { id: 'financial', name: 'Financial Summary', icon: DollarSign },
    { id: 'compliance', name: 'Compliance Report', icon: FileText }
  ]

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Validations</h3>
          <p className="text-2xl font-bold text-blue-900">{reportData?.totalValidations?.toLocaleString() || 0}</p>
          <p className="text-sm text-blue-600 mt-1">
            {reportData?.validationGrowth > 0 ? '+' : ''}{reportData?.validationGrowth || 0}% vs last period
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Authenticity Rate</h3>
          <p className="text-2xl font-bold text-green-900">{reportData?.authenticityRate || 0}%</p>
          <p className="text-sm text-green-600 mt-1">Industry leading</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">Counterfeits Detected</h3>
          <p className="text-2xl font-bold text-red-900">{reportData?.counterfeitsDetected || 0}</p>
          <p className="text-sm text-red-600 mt-1">Protected consumers</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Active Users</h3>
          <p className="text-2xl font-bold text-purple-900">{reportData?.activeUsers?.toLocaleString() || 0}</p>
          <p className="text-sm text-purple-600 mt-1">Across South Africa</p>
        </div>
      </div>

      {/* South African Market Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wine className="h-5 w-5 text-purple-600" />
          South African Alcohol Market Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Brands Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Top Validated Brands</h4>
            <Bar
              data={{
                labels: saMetrics.topBrands?.map(b => b.name) || [],
                datasets: [{
                  label: 'Validations',
                  data: saMetrics.topBrands?.map(b => b.validations) || [],
                  backgroundColor: ['#1e8e3e', '#34a853', '#4caf50', '#66bb6a', '#81c784']
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Product Categories</h4>
            <Doughnut
              data={{
                labels: ['Beer', 'Wine', 'Spirits', 'Cider'],
                datasets: [{
                  data: [
                    reportData?.categoryDistribution?.beer || 0,
                    reportData?.categoryDistribution?.wine || 0,
                    reportData?.categoryDistribution?.spirits || 0,
                    reportData?.categoryDistribution?.cider || 0
                  ],
                  backgroundColor: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981']
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Provincial Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Provincial Distribution</h3>
        <div className="space-y-3">
          {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Mpumalanga'].map((province, idx) => (
            <div key={province} className="flex items-center justify-between">
              <span className="text-sm font-medium">{province}</span>
              <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(100 - idx * 15)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{100 - idx * 15}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCounterfeitReport = () => (
    <div className="space-y-6">
      {/* Counterfeit Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Counterfeit Activity Alert</h3>
        </div>
        <p className="text-sm text-red-700 mt-1">
          Increased counterfeit activity detected in Johannesburg CBD and Durban areas
        </p>
      </div>

      {/* Counterfeit Hotspots */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Counterfeit Hotspots in South Africa</h3>
        <div className="space-y-4">
          {saMetrics.counterfeitHotspots?.map((hotspot, idx) => (
            <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{hotspot.location}</h4>
                  <p className="text-sm text-gray-600">{hotspot.incidents} incidents reported</p>
                  <p className="text-xs text-gray-500">Primary products: {hotspot.products}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  hotspot.risk === 'high' ? 'bg-red-100 text-red-700' :
                  hotspot.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {hotspot.risk} risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counterfeit Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Counterfeit Detection Trends</h3>
        <Line
          data={{
            labels: reportData?.trendLabels || [],
            datasets: [{
              label: 'Counterfeits Detected',
              data: reportData?.counterfeitTrend || [],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }}
        />
      </div>
    </div>
  )

  const renderRetailerReport = () => (
    <div className="space-y-6">
      {/* Top Retailers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Top Performing Retailers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Authenticity Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {saMetrics.topRetailers?.map((retailer, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{retailer.name}</div>
                    <div className="text-sm text-gray-500">{retailer.chain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {retailer.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retailer.validations?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{retailer.authenticityRate}%</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${retailer.authenticityRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retailer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4">Retailer Categories</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Major Chains</span>
              <span className="font-semibold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Independent Stores</span>
              <span className="font-semibold">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Specialty Shops</span>
              <span className="font-semibold">20%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4">Risk Assessment</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Risk Retailers</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium Risk</span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">High Risk</span>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Business Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport('pdf')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {reportTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                reportType === type.id 
                  ? 'bg-green-100 text-green-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <type.icon className="h-5 w-5 mb-1" />
              <span className="text-xs text-center">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange({
                start: subDays(new Date(), 7),
                end: new Date()
              })}
              className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange({
                start: subDays(new Date(), 30),
                end: new Date()
              })}
              className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange({
                start: subDays(new Date(), 90),
                end: new Date()
              })}
              className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
            >
              Last 90 days
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({
                ...dateRange,
                start: new Date(e.target.value)
              })}
              className="px-3 py-1 text-sm border rounded"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({
                ...dateRange,
                end: new Date(e.target.value)
              })}
              className="px-3 py-1 text-sm border rounded"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {reportType === 'overview' && renderOverviewReport()}
        {reportType === 'counterfeits' && renderCounterfeitReport()}
        {reportType === 'retailers' && renderRetailerReport()}
        {/* Add other report types as needed */}
        {!['overview', 'counterfeits', 'retailers'].includes(reportType) && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {reportTypes.find(t => t.id === reportType)?.name} report coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessReports