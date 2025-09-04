import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  MapPin,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
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
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('validations')
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData({
        summary: {
          totalValidations: 45678,
          validationGrowth: 15.3,
          authenticityRate: 94.2,
          counterfeitsDetected: 342,
          activeUsers: 12450,
          userGrowth: 8.7
        },
        trends: {
          validations: [
            { date: '2024-01', value: 3200 },
            { date: '2024-02', value: 3800 },
            { date: '2024-03', value: 4100 },
            { date: '2024-04', value: 3900 },
            { date: '2024-05', value: 4500 },
            { date: '2024-06', value: 5200 },
            { date: '2024-07', value: 5800 },
            { date: '2024-08', value: 6200 }
          ],
          counterfeits: [
            { date: '2024-01', value: 28 },
            { date: '2024-02', value: 32 },
            { date: '2024-03', value: 45 },
            { date: '2024-04', value: 38 },
            { date: '2024-05', value: 52 },
            { date: '2024-06', value: 48 },
            { date: '2024-07', value: 55 },
            { date: '2024-08', value: 44 }
          ]
        },
        geographic: {
          topLocations: [
            { city: 'Johannesburg', validations: 8234, counterfeits: 89 },
            { city: 'Cape Town', validations: 6543, counterfeits: 56 },
            { city: 'Durban', validations: 5432, counterfeits: 67 },
            { city: 'Pretoria', validations: 4321, counterfeits: 45 },
            { city: 'Port Elizabeth', validations: 3210, counterfeits: 34 }
          ]
        },
        products: {
          topProducts: [
            { name: 'Castle Lager 750ml', validations: 5432, authenticityRate: 96.5 },
            { name: 'Black Label 750ml', validations: 4321, authenticityRate: 94.2 },
            { name: 'Savanna Dry 500ml', validations: 3456, authenticityRate: 95.8 },
            { name: 'Klipdrift Brandy 750ml', validations: 2890, authenticityRate: 93.1 },
            { name: 'Amarula Cream 750ml', validations: 2345, authenticityRate: 97.2 }
          ]
        },
        channels: {
          performance: [
            { channel: 'Tops at SPAR', score: 94, validations: 8765, issues: 12 },
            { channel: 'Makro Liquor', score: 92, validations: 7654, issues: 18 },
            { channel: 'Pick n Pay Liquor', score: 96, validations: 6543, issues: 8 },
            { channel: 'Checkers LiquorShop', score: 91, validations: 5432, issues: 22 },
            { channel: 'Ultra Liquors', score: 88, validations: 4321, issues: 34 }
          ]
        }
      })
      setLoading(false)
    }, 1000)
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Chart configurations
  const validationTrendChart = {
    labels: analyticsData.trends.validations.map(d => d.date),
    datasets: [
      {
        label: 'Validations',
        data: analyticsData.trends.validations.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const counterfeitTrendChart = {
    labels: analyticsData.trends.counterfeits.map(d => d.date),
    datasets: [
      {
        label: 'Counterfeits Detected',
        data: analyticsData.trends.counterfeits.map(d => d.value),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      }
    ]
  }

  const geographicChart = {
    labels: analyticsData.geographic.topLocations.map(l => l.city),
    datasets: [
      {
        label: 'Validations',
        data: analyticsData.geographic.topLocations.map(l => l.validations),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Counterfeits',
        data: analyticsData.geographic.topLocations.map(l => l.counterfeits),
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      }
    ]
  }

  const authenticityRateChart = {
    labels: ['Authentic', 'Counterfeit'],
    datasets: [
      {
        data: [analyticsData.summary.authenticityRate, 100 - analyticsData.summary.authenticityRate],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0
      }
    ]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Validations</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalValidations.toLocaleString()}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm font-medium">+{analyticsData.summary.validationGrowth}%</span>
            <span className="text-gray-500 text-sm ml-1">vs last period</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Authenticity Rate</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.authenticityRate}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${analyticsData.summary.authenticityRate}%` }}
            ></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.activeUsers.toLocaleString()}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm font-medium">+{analyticsData.summary.userGrowth}%</span>
            <span className="text-gray-500 text-sm ml-1">new users</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Validation Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Trends</h3>
          <div className="h-64">
            <Line 
              data={validationTrendChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Counterfeit Detection */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Counterfeit Detection</h3>
          <div className="h-64">
            <Bar 
              data={counterfeitTrendChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="h-64">
            <Bar 
              data={geographicChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authenticity Breakdown</h3>
          <div className="h-64">
            <Doughnut 
              data={authenticityRateChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Product</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Validations</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Authenticity</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.products.topProducts.map((product, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm text-gray-900">{product.name}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{product.validations.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.authenticityRate >= 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.authenticityRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Channel</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Score</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Issues</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.channels.performance.map((channel, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm text-gray-900">{channel.channel}</td>
                    <td className="py-3 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        channel.score >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {channel.score}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">{channel.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics