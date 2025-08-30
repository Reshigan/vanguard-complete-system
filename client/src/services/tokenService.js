import api from './api'

export const tokenService = {
  async validateToken(tokenHash, location, deviceInfo) {
    const response = await api.post('/tokens/validate', {
      tokenHash,
      location,
      deviceInfo
    })
    return response.data
  },

  async invalidateToken(tokenHash, location, photos) {
    const response = await api.post('/tokens/invalidate', {
      tokenHash,
      location,
      photos
    })
    return response.data
  },

  async getTokenInfo(tokenHash) {
    const response = await api.get(`/tokens/${tokenHash}/info`)
    return response.data
  },

  async getTokenHistory(tokenId) {
    const response = await api.get(`/tokens/${tokenId}/history`)
    return response.data
  },

  async getMyTokens(params = {}) {
    const response = await api.get('/tokens/my-tokens', { params })
    return response.data
  },

  async createBatchTokens(batchData) {
    const response = await api.post('/tokens/batch-create', batchData)
    return response.data
  }
}