import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Scan, 
  FileText, 
  Gift, 
  Heart,
  BarChart3
} from 'lucide-react'

const Navigation = () => {
  const { isAuthenticated, hasRole } = useAuth()

  const navItems = [
    { to: '/', icon: Home, label: 'Home', public: true },
    { to: '/scan', icon: Scan, label: 'Scan', public: true },
    { to: '/responsible-drinking', icon: Heart, label: 'Responsible', public: true },
    { to: '/reports', icon: FileText, label: 'Reports', auth: true },
    { to: '/rewards', icon: Gift, label: 'Rewards', auth: true },
  ]

  // Add dashboard for manufacturers/distributors
  if (hasRole(['manufacturer', 'distributor', 'admin'])) {
    navItems.push({ to: '/dashboard', icon: BarChart3, label: 'Dashboard', auth: true })
  }

  const filteredItems = navItems.filter(item => {
    if (item.public) return true
    if (item.auth) return isAuthenticated
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around">
          {filteredItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-authentiguard-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation