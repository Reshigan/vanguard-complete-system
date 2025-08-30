import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  MapPin, 
  Clock,
  Users,
  Package,
  Eye,
  CheckCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    const mockData = {
      stats: {
        totalTokens: 15420,
        activeTokens: 12350,
        validatedTokens: 2890,
        counterfeitReports: 180,
        totalUsers: 8500,
        newUsersThisMonth: 450
      },
      recentReports: [
        {
          id: '1',
          tokenHash: 'a1b2c3d4e5f6g7h8',
          productName: 'Vanguard Reserve',
          location: 'New York, NY',
          status: 'confirmed',
          reportedAt: '2024-08-25T10:30:00Z',
          reporter: 'john.smith0@gmail.com'
        },
        {
          id: '2',
          tokenHash: 'b2c3d4e5f6g7h8i9',
          productName: 'Premium Spirits Classic',
          location: 'Los Angeles, CA',
          status: 'investigating',
          reportedAt: '2024-08-24T15:45:00Z',
          reporter: 'jane.doe@example.com'
        },
        {
          id: '3',
          tokenHash: 'c3d4e5f6g7h8i9j0',
          productName: 'Bourbon Masters Single',
          location: 'Chicago, IL',
          status: 'pending',
          reportedAt: '2024-08-23T09:20:00Z',
          reporter: 'mike.wilson@test.com'
        }
      ],
      recentValidations: [
        {
          id: '1',
          tokenHash: 'd4e5f6g7h8i9j0k1',
          productName: 'Vanguard Reserve',
          location: 'Boston, MA',
          validatedAt: '2024-08-25T14:20:00Z',
          user: 'sarah.johnson@gmail.com'
        },
        {
          id: '2',
          tokenHash: 'e5f6g7h8i9j0k1l2',
          productName: 'Premium Spirits Classic',
          location: 'Seattle, WA',
          validatedAt: '2024-08-25T11:15:00Z',
          user: 'david.brown@yahoo.com'
        }
      ],
      chartData: {
        validations: [
          { date: '2024-08-19', count: 45 },
          { date: '2024-08-20', count: 52 },
          { date: '2024-08-21', count: 38 },
          { date: '2024-08-22', count: 61 },
          { date: '2024-08-23', count: 49 },
          { date: '2024-08-24', count: 67 },
          { date: '2024-08-25', count: 73 }
        ],
        reports: [
          { date: '2024-08-19', count: 2 },
          { date: '2024-08-20', count: 1 },
          { date: '2024-08-21', count: 3 },
          { date: '2024-08-22', count: 0 },
          { date: '2024-08-23', count: 2 },
          { date: '2024-08-24', count: 1 },
          { date: '2024-08-25', count: 4 }
        ]
      }
    }

    setTimeout(() => {
      setDashboardData(mockData)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-gray', text: 'Pending' },
      investigating: { color: 'badge-warning', text: 'Investigating' },
      confirmed: { color: 'badge-danger', text: 'Confirmed' },
      false_positive: { color: 'badge-gray', text: 'False Positive' }
    }

    const config = statusConfig[status] || statusConfig.pending
    return <span className={config.color}>{config.text}</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'manufacturer' ? 'Manufacturer' : 'Distributor'} Analytics & Monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalTokens.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeTokens.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {Math.round((dashboardData.stats.activeTokens / dashboardData.stats.totalTokens) * 100)}% of total
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validated</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.validatedTokens.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+8%</span>
            <span className="text-gray-500 ml-1">this week</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Counterfeit Reports</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.counterfeitReports}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600">3 pending review</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Validations Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Validations</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {dashboardData.chartData.validations.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-blue-500 rounded-t w-full"
                  style={{ height: `${(item.count / 80) * 100}%`, minHeight: '4px' }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.date).getDate()}
                </div>
                <div className="text-xs font-medium text-gray-700">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Counterfeit Reports</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {dashboardData.chartData.reports.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-red-500 rounded-t w-full"
                  style={{ height: `${(item.count / 5) * 100}%`, minHeight: item.count > 0 ? '8px' : '2px' }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.date).getDate()}
                </div>
                <div className="text-xs font-medium text-gray-700">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Counterfeit Reports</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData.recentReports.map(report => (
              <div key={report.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{report.productName}</h4>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(report.reportedAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Token: {report.tokenHash}...
                  </p>
                </div>
                <button className="text-vanguard-600 hover:text-vanguard-800 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Validations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Validations</h3>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData.recentValidations.map(validation => (
              <div key={validation.id} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{validation.productName}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{validation.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(validation.validatedAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Token: {validation.tokenHash}...
                  </p>
                </div>
                <div className="text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard