import React, { useState, useEffect } from 'react'
import { User, Bell, Shield, Globe, Smartphone, CreditCard, Key, Mail, MapPin, Save, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form states
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    location: '',
    language: 'en',
    timezone: 'Africa/Johannesburg'
  })
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    marketingEmails: false,
    validationAlerts: true,
    counterfeitAlerts: true,
    rewardNotifications: true,
    systemUpdates: false
  })
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: '30',
    passwordExpiry: '90'
  })
  
  const [preferences, setPreferences] = useState({
    defaultLocation: 'current',
    preferredCategories: [],
    displayCurrency: 'ZAR',
    measurementUnit: 'metric',
    theme: 'light'
  })

  // South African locations
  const saLocations = [
    'Johannesburg, Gauteng',
    'Cape Town, Western Cape',
    'Durban, KwaZulu-Natal',
    'Pretoria, Gauteng',
    'Port Elizabeth, Eastern Cape',
    'Bloemfontein, Free State',
    'East London, Eastern Cape',
    'Stellenbosch, Western Cape',
    'Pietermaritzburg, KwaZulu-Natal',
    'Kimberley, Northern Cape'
  ]

  const alcoholCategories = [
    'Beer',
    'Wine',
    'Spirits',
    'Cider',
    'Brandy',
    'Whisky',
    'Gin',
    'Vodka',
    'Rum'
  ]

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        language: user.language || 'en',
        timezone: user.timezone || 'Africa/Johannesburg'
      })
      // Load other settings from API
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    try {
      setLoading(true)
      // In a real app, this would fetch from API
      // const response = await api.get('/api/user/settings')
      // setNotifications(response.data.notifications)
      // setSecurity(response.data.security)
      // setPreferences(response.data.preferences)
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      // const response = await api.put('/api/user/profile', profile)
      // updateUser(response.data.user)
      toast.success('Profile updated successfully')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true)
      // await api.put('/api/user/notifications', notifications)
      toast.success('Notification preferences updated')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to update notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityUpdate = async () => {
    try {
      setLoading(true)
      // await api.put('/api/user/security', security)
      toast.success('Security settings updated')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to update security settings')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true)
      // await api.put('/api/user/preferences', preferences)
      toast.success('Preferences updated')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    // Navigate to password change flow
    toast.info('Password change feature coming soon')
  }

  const enable2FA = async () => {
    try {
      // const response = await api.post('/api/user/2fa/enable')
      // Show QR code for 2FA setup
      toast.success('2FA setup initiated')
      setSecurity({ ...security, twoFactorEnabled: true })
    } catch (error) {
      toast.error('Failed to enable 2FA')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: Globe }
  ]

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={profile.username}
            onChange={(e) => {
              setProfile({ ...profile, username: e.target.value })
              setHasChanges(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => {
              setProfile({ ...profile, email: e.target.value })
              setHasChanges(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => {
              setProfile({ ...profile, phone: e.target.value })
              setHasChanges(true)
            }}
            placeholder="+27 XX XXX XXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={profile.location}
            onChange={(e) => {
              setProfile({ ...profile, location: e.target.value })
              setHasChanges(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select location</option>
            {saLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={profile.language}
            onChange={(e) => {
              setProfile({ ...profile, language: e.target.value })
              setHasChanges(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="en">English</option>
            <option value="af">Afrikaans</option>
            <option value="zu">Zulu</option>
            <option value="xh">Xhosa</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={profile.timezone}
            onChange={(e) => {
              setProfile({ ...profile, timezone: e.target.value })
              setHasChanges(true)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Africa/Johannesburg">South Africa (SAST)</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleProfileUpdate}
          disabled={!hasChanges || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alert Preferences</h3>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-gray-600">Receive important notifications via email</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifications.emailAlerts}
            onChange={(e) => {
              setNotifications({ ...notifications, emailAlerts: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-gray-600">Get SMS for critical alerts</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifications.smsAlerts}
            onChange={(e) => {
              setNotifications({ ...notifications, smsAlerts: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Mobile app notifications</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifications.pushNotifications}
            onChange={(e) => {
              setNotifications({ ...notifications, pushNotifications: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Types</h3>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <p className="font-medium">Validation Alerts</p>
            <p className="text-sm text-gray-600">Notifications for product validations</p>
          </div>
          <input
            type="checkbox"
            checked={notifications.validationAlerts}
            onChange={(e) => {
              setNotifications({ ...notifications, validationAlerts: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <p className="font-medium">Counterfeit Alerts</p>
            <p className="text-sm text-gray-600">Alerts when counterfeits are detected in your area</p>
          </div>
          <input
            type="checkbox"
            checked={notifications.counterfeitAlerts}
            onChange={(e) => {
              setNotifications({ ...notifications, counterfeitAlerts: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div>
            <p className="font-medium">Reward Notifications</p>
            <p className="text-sm text-gray-600">Updates about points and rewards</p>
          </div>
          <input
            type="checkbox"
            checked={notifications.rewardNotifications}
            onChange={(e) => {
              setNotifications({ ...notifications, rewardNotifications: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </label>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleNotificationUpdate}
          disabled={!hasChanges || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Security Recommendation</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Enable two-factor authentication to add an extra layer of security to your account
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-600">Last changed 30 days ago</p>
            </div>
          </div>
          <button
            onClick={handlePasswordChange}
            className="btn-secondary text-sm"
          >
            Change Password
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                {security.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
          </div>
          {!security.twoFactorEnabled ? (
            <button
              onClick={enable2FA}
              className="btn-secondary text-sm"
            >
              Enable 2FA
            </button>
          ) : (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Biometric Authentication</p>
              <p className="text-sm text-gray-600">Use fingerprint or face ID</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={security.biometricEnabled}
            onChange={(e) => {
              setSecurity({ ...security, biometricEnabled: e.target.checked })
              setHasChanges(true)
            }}
            className="h-5 w-5 text-green-600"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Session Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-logout after inactivity
          </label>
          <select
            value={security.sessionTimeout}
            onChange={(e) => {
              setSecurity({ ...security, sessionTimeout: e.target.value })
              setHasChanges(true)
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSecurityUpdate}
          disabled={!hasChanges || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Security Settings
        </button>
      </div>
    </div>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Display Preferences</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={preferences.displayCurrency}
            onChange={(e) => {
              setPreferences({ ...preferences, displayCurrency: e.target.value })
              setHasChanges(true)
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ZAR">South African Rand (R)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={preferences.theme}
            onChange={(e) => {
              setPreferences({ ...preferences, theme: e.target.value })
              setHasChanges(true)
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Preferences</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {alcoholCategories.map(category => (
              <label key={category} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.preferredCategories?.includes(category)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...(preferences.preferredCategories || []), category]
                      : (preferences.preferredCategories || []).filter(c => c !== category)
                    setPreferences({ ...preferences, preferredCategories: updated })
                    setHasChanges(true)
                  }}
                  className="h-4 w-4 text-green-600"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Location Setting
          </label>
          <select
            value={preferences.defaultLocation}
            onChange={(e) => {
              setPreferences({ ...preferences, defaultLocation: e.target.value })
              setHasChanges(true)
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="current">Use current location</option>
            <option value="saved">Use saved location</option>
            <option value="ask">Always ask</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handlePreferencesUpdate}
          disabled={!hasChanges || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  )

  if (loading && !user) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
        </div>
      </div>
      
      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button className="text-gray-600 hover:text-gray-800">
            Download my data
          </button>
          <div className="border-t pt-3">
            <button className="text-red-600 hover:text-red-800">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings