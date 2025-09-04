import { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Package,
  Search,
  Filter,
  Download,
  TrendingUp,
  Activity
} from 'lucide-react'

const Authentication = () => {
  const [authentications, setAuthentications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        total: 15678,
        authentic: 14732,
        counterfeit: 946,
        pending: 23,
        authenticityRate: 94.0,
        recentGrowth: 12.5
      })

      setAuthentications([
        {
          id: 1,
          tokenHash: 'NXT-2024-SAB-CASTLE-750-0001',
          product: 'Castle Lager 750ml',
          status: 'authentic',
          location: 'Johannesburg, GP',
          user: 'john.doe@example.com',
          timestamp: '2024-08-25T14:30:00Z',
          retailer: 'Tops at SPAR',
          confidence: 99.8
        },
        {
          id: 2,
          tokenHash: 'NXT-2024-SAB-BLACK-750-0002',
          product: 'Black Label 750ml',
          status: 'counterfeit',
          location: 'Cape Town, WC',
          user: 'jane.smith@example.com',
          timestamp: '2024-08-25T14:25:00Z',
          retailer: 'Unknown',
          confidence: 98.5,
          reportId: 'RPT-2024-0234'
        },
        {
          id: 3,
          tokenHash: 'NXT-2024-DIS-SAVANNA-500-0003',
          product: 'Savanna Dry 500ml',
          status: 'authentic',
          location: 'Durban, KZN',
          user: 'mike.wilson@example.com',
          timestamp: '2024-08-25T14:20:00Z',
          retailer: 'Makro Liquor',
          confidence: 99.9
        },
        {
          id: 4,
          tokenHash: 'NXT-2024-DIS-KLIP-750-0004',
          product: 'Klipdrift Brandy 750ml',
          status: 'suspicious',
          location: 'Pretoria, GP',
          user: 'sarah.jones@example.com',
          timestamp: '2024-08-25T14:15:00Z',
          retailer: 'Ultra Liquors',
          confidence: 75.2,
          issues: ['Location mismatch', 'Unusual scan pattern']
        },
        {
          id: 5,
          tokenHash: 'NXT-2024-DIS-AMARULA-750-0005',
          product: 'Amarula Cream 750ml',
          status: 'authentic',
          location: 'Port Elizabeth, EC',
          user: 'david.brown@example.com',
          timestamp: '2024-08-25T14:10:00Z',
          retailer: 'Pick n Pay Liquor',
          confidence: 99.7
        }
      ])
      setLoading(false)
    }, 1000)
  }, [timeRange])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'authentic':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'counterfeit':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'suspicious':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      authentic: 'bg-green-100 text-green-800',
      counterfeit: 'bg-red-100 text-red-800',
      suspicious: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    }
    return badges[status] || badges.pending
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAuthentications = authentications.filter(auth => {
    const matchesSearch = auth.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auth.tokenHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auth.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || auth.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authentication Logs</h1>
          <p className="text-gray-600">Monitor and analyze product authentication activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Scans</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm">+{stats.recentGrowth}%</span>
            <span className="text-gray-500 text-sm ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Authentic</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.authentic.toLocaleString()}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${stats.authenticityRate}%` }}
            ></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Counterfeit</h3>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.counterfeit.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">
            {((stats.counterfeit / stats.total) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Authenticity Rate</h3>
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.authenticityRate}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.pending} pending review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product, token, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="authentic">Authentic</option>
          <option value="counterfeit">Counterfeit</option>
          <option value="suspicious">Suspicious</option>
        </select>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Authentication Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAuthentications.map((auth) => (
                <tr key={auth.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(auth.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(auth.status)}`}>
                        {auth.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{auth.product}</div>
                        {auth.retailer && (
                          <div className="text-sm text-gray-500">{auth.retailer}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{auth.tokenHash}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {auth.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 text-gray-400 mr-1" />
                      {auth.user}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{auth.confidence}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            auth.confidence >= 90 ? 'bg-green-500' : 
                            auth.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${auth.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      {formatTimestamp(auth.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing 1 to {filteredAuthentications.length} of {stats.total} results
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            3
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Authentication