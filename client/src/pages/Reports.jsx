import { useState, useEffect } from 'react'
import { FileText, MapPin, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    const mockReports = [
      {
        id: '1',
        tokenHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        productName: 'AuthentiGuard Reserve',
        manufacturer: 'AuthentiGuard Distillery',
        status: 'confirmed',
        rewardAmount: 100,
        location: 'New York, NY',
        createdAt: '2024-08-25T10:30:00Z',
        description: 'Token already validated - potential counterfeit detected'
      },
      {
        id: '2',
        tokenHash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        productName: 'Premium Spirits Classic',
        manufacturer: 'Premium Spirits Co.',
        status: 'investigating',
        rewardAmount: 0,
        location: 'Los Angeles, CA',
        createdAt: '2024-08-20T14:15:00Z',
        description: 'Suspicious packaging and labeling quality'
      },
      {
        id: '3',
        tokenHash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
        productName: 'Bourbon Masters Single Barrel',
        manufacturer: 'Bourbon Masters LLC',
        status: 'false_positive',
        rewardAmount: 0,
        location: 'Chicago, IL',
        createdAt: '2024-08-15T09:45:00Z',
        description: 'Initial concern about NXT Tag sticker placement'
      }
    ]

    setTimeout(() => {
      setReports(mockReports)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-gray', icon: Clock, text: 'Pending' },
      investigating: { color: 'badge-warning', icon: Eye, text: 'Investigating' },
      confirmed: { color: 'badge-success', icon: CheckCircle, text: 'Confirmed' },
      false_positive: { color: 'badge-gray', icon: AlertTriangle, text: 'False Positive' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`${config.color} inline-flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.status === filter
  })

  const totalRewards = reports
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.rewardAmount, 0)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-600">Track your counterfeit reports and rewards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{totalRewards}</div>
          <div className="text-sm text-gray-500">Total Rewards Earned</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'pending', label: 'Pending' },
          { key: 'investigating', label: 'Investigating' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'false_positive', label: 'False Positive' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white text-authentiguard-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You haven't submitted any counterfeit reports yet."
              : `No reports with status "${filter}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div key={report.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{report.productName}</h3>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{report.manufacturer}</p>
                  <p className="text-sm text-gray-500">
                    Token: {report.tokenHash.slice(0, 16)}...
                  </p>
                </div>
                {report.rewardAmount > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +{report.rewardAmount}
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                  
                  <button className="text-authentiguard-600 hover:text-authentiguard-800 font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
          <div className="text-sm text-blue-800">Total Reports</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.status === 'confirmed').length}
          </div>
          <div className="text-sm text-green-800">Confirmed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {reports.filter(r => r.status === 'investigating').length}
          </div>
          <div className="text-sm text-yellow-800">Under Investigation</div>
        </div>
      </div>
    </div>
  )
}

export default Reports