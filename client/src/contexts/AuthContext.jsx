import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'


export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
          )
          
          const userData = await Promise.race([
            authService.getProfile(),
            timeoutPromise
          ])
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Mock login: allow any credentials, set a fake user and tokens
  const login = async (email, password) => {
    const isAdmin = email && email.toLowerCase() === 'admin@example.com';
    if (isAdmin) {
      const fakeUser = {
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
        id: 'admin-user-id',
      };
      setUser(fakeUser);
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      toast.success('Login successful!');
      return { user: fakeUser, tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' } };
    } else {
      const fakeUser = {
        email,
        role: 'manufacturer',
        name: 'Demo User',
        id: 'demo-user-id',
      };
      setUser(fakeUser);
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      toast.success('Login successful!');
      return { user: fakeUser, tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' } };
    }
  }

  // Mock register: allow any data, set a fake user and tokens
  const register = async (userData) => {
    const isAdmin = userData?.email && userData.email.toLowerCase() === 'admin@example.com';
    if (isAdmin) {
      const fakeUser = {
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
        id: 'admin-user-id',
      };
      setUser(fakeUser);
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      toast.success('Registration successful!');
      return { user: fakeUser, tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' } };
    } else {
      const fakeUser = {
        ...userData,
        role: 'manufacturer',
        id: 'demo-user-id',
        name: userData.name || 'Demo User',
      };
      setUser(fakeUser);
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      toast.success('Registration successful!');
      return { user: fakeUser, tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' } };
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData)
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      return updatedUser
    } catch (error) {
      toast.error(error.message || 'Profile update failed')
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    hasRole: (roles) => {
      if (!user) return false
      if (Array.isArray(roles)) {
        return roles.includes(user.role)
      }
      return user.role === roles
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}