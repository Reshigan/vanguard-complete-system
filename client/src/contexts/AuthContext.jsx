import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

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

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      setUser(response.user)
      localStorage.setItem('accessToken', response.tokens.accessToken)
      localStorage.setItem('refreshToken', response.tokens.refreshToken)
      toast.success('Login successful!')
      return response
    } catch (error) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      setUser(response.user)
      localStorage.setItem('accessToken', response.tokens.accessToken)
      localStorage.setItem('refreshToken', response.tokens.refreshToken)
      toast.success('Registration successful!')
      return response
    } catch (error) {
      toast.error(error.message || 'Registration failed')
      throw error
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