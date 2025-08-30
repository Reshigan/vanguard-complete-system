import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Shield, 
  Scan, 
  AlertTriangle, 
  Gift, 
  TrendingUp,
  Users,
  CheckCircle,
  Heart
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: Scan,
      title: 'Instant Verification',
      description: 'Tap your phone to any NFC-enabled product to verify authenticity instantly.',
      color: 'text-blue-600'
    },
    {
      icon: AlertTriangle,
      title: 'Report Counterfeits',
      description: 'Help protect others by reporting suspicious products and earn rewards.',
      color: 'text-red-600'
    },
    {
      icon: Gift,
      title: 'Earn Rewards',
      description: 'Get points for validating products and reporting counterfeits.',
      color: 'text-green-600'
    },
    {
      icon: Heart,
      title: 'Drink Responsibly',
      description: 'Access resources and tools for responsible alcohol consumption.',
      color: 'text-purple-600'
    }
  ]

  const stats = [
    { label: 'Products Protected', value: '2.5M+', icon: Shield },
    { label: 'Active Users', value: '150K+', icon: Users },
    { label: 'Counterfeits Detected', value: '12K+', icon: AlertTriangle },
    { label: 'Rewards Distributed', value: '$500K+', icon: Gift }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="bg-vanguard-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Vanguard
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your trusted partner in product authentication. Protect yourself and others 
          from counterfeit products with our advanced NFC verification system.
        </p>
        
        {isAuthenticated ? (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-success-800 font-medium">
                Welcome back, {user?.email}!
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg">
              Get Started
            </Link>
            <Link to="/scan" className="btn-secondary btn-lg">
              Try Scanner
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Link
          to="/scan"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Scan className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scan Product</h3>
              <p className="text-sm text-gray-600">Verify authenticity instantly</p>
            </div>
          </div>
        </Link>

        <Link
          to="/responsible-drinking"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Drink Responsibly</h3>
              <p className="text-sm text-gray-600">Resources and guidelines</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How Vanguard Protects You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card text-center">
              <div className={`inline-flex p-3 rounded-lg bg-gray-100 mb-4 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-vanguard-700 rounded-2xl p-8 text-white mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          Trusted by Millions Worldwide
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex p-3 bg-white/10 rounded-lg mb-3">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-vanguard-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of users protecting themselves from counterfeit products.
          </p>
          <Link to="/register" className="btn-primary btn-lg">
            Create Your Account
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home