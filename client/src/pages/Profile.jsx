import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Phone, MapPin, Building, Edit2, Save, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    profile: {
      name: user?.profile?.name || '',
      country: user?.profile?.country || '',
      company: user?.profile?.company || '',
      age: user?.profile?.age || ''
    }
  })

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Japan', 'Mexico', 'Brazil', 'India', 'China', 'Other'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, [profileField]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      phone: user?.phone || '',
      profile: {
        name: user?.profile?.name || '',
        country: user?.profile?.country || '',
        company: user?.profile?.company || '',
        age: user?.profile?.age || ''
      }
    })
    setIsEditing(false)
  }

  const getRoleDisplayName = (role) => {
    const roleNames = {
      consumer: 'Consumer',
      manufacturer: 'Manufacturer',
      distributor: 'Distributor',
      admin: 'Administrator'
    }
    return roleNames[role] || role
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      consumer: 'badge-gray',
      manufacturer: 'badge-success',
      distributor: 'badge-warning',
      admin: 'badge-danger'
    }
    return colors[role] || 'badge-gray'
  }

  const stats = [
    { label: 'Reward Points', value: user?.rewards_balance || 0, color: 'text-green-600' },
    { label: 'Products Scanned', value: 23, color: 'text-blue-600' },
    { label: 'Reports Submitted', value: 3, color: 'text-orange-600' },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).getFullYear() : 2024, color: 'text-purple-600' }
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="bg-authentiguard-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-10 w-10 text-authentiguard-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{user?.profile?.name || 'User Profile'}</h1>
        <span className={`${getRoleBadgeColor(user?.role)} text-sm`}>
          {getRoleDisplayName(user?.role)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary btn-sm flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary btn-sm flex items-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary btn-sm flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="profile.name"
                value={formData.profile.name}
                onChange={handleChange}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{user?.profile?.name || 'Not provided'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{user?.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="Optional"
              />
            ) : (
              <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Country
            </label>
            {isEditing ? (
              <select
                name="profile.country"
                value={formData.profile.country}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{user?.profile?.country || 'Not provided'}</p>
            )}
          </div>

          {/* Company (for manufacturers/distributors) */}
          {(user?.role === 'manufacturer' || user?.role === 'distributor') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Company
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="profile.company"
                  value={formData.profile.company}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{user?.profile?.company || 'Not provided'}</p>
              )}
            </div>
          )}

          {/* Age (for consumers) */}
          {user?.role === 'consumer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="profile.age"
                  value={formData.profile.age}
                  onChange={handleChange}
                  className="input"
                  min="18"
                  max="120"
                />
              ) : (
                <p className="text-gray-900">{user?.profile?.age || 'Not provided'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Receive email notifications about your reports and rewards</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-authentiguard-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-authentiguard-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Communications</h3>
              <p className="text-sm text-gray-600">Receive updates about new features and promotions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-authentiguard-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-authentiguard-600"></div>
            </label>
          </div>

          <div className="pt-4">
            <button className="text-red-600 hover:text-red-800 font-medium text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile