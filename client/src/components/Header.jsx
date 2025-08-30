import { useAuth } from '../contexts/AuthContext'
import { Shield, User, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-vanguard-700 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-vanguard-900">Vanguard</h1>
              <p className="text-xs text-gray-500 -mt-1">Product Authentication</p>
            </div>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-vanguard-700 hover:text-vanguard-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header