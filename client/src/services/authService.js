import api from './api'

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout(refreshToken) {
    const response = await api.post('/auth/logout', { refreshToken })
    return response.data
  },

  async getProfile() {
    const response = await api.get('/auth/me')
    return response.data.user
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData)
    return response.data.user
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  }
}