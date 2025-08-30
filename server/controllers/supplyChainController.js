const db = require('../config/mockDatabase');

const supplyChainController = {
  // Track a token through the supply chain
  async trackToken(req, res) {
    try {
      const { tokenId } = req.params;

      // Get token details
      const token = await db('tokens')
        .select('*')
        .where('id', tokenId)
        .first();

      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found'
        });
      }

      // Get product details
      const product = await db('products')
        .select('*')
        .where('id', token.product_id)
        .first();

      // Get manufacturer details
      const manufacturer = await db('manufacturers')
        .select('name', 'location', 'contact_email')
        .where('id', product.manufacturer_id)
        .first();

      // Get validation history
      const validations = await db('token_validations')
        .select('*')
        .where('token_id', tokenId)
        .orderBy('validated_at', 'desc');

      // Get reports if any
      const reports = await db('counterfeit_reports')
        .select('*')
        .where('token_id', tokenId)
        .orderBy('reported_at', 'desc');

      res.json({
        success: true,
        data: {
          token,
          product,
          manufacturer,
          validations,
          reports,
          supply_chain: [
            {
              stage: 'Manufacturing',
              location: manufacturer.location,
              timestamp: token.created_at,
              status: 'completed'
            },
            {
              stage: 'Distribution',
              location: 'In Transit',
              timestamp: token.created_at,
              status: token.status === 'active' ? 'in_progress' : 'completed'
            },
            {
              stage: 'Retail',
              location: 'Point of Sale',
              timestamp: validations.length > 0 ? validations[0].validated_at : null,
              status: validations.length > 0 ? 'completed' : 'pending'
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error tracking token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get supply chain analytics
  async getAnalytics(req, res) {
    try {
      const { manufacturerId } = req.params;

      // Verify manufacturer access
      if (req.user.role === 'manufacturer' && req.user.manufacturer_id !== parseInt(manufacturerId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get total tokens
      const totalTokens = await db('tokens')
        .join('products', 'tokens.product_id', 'products.id')
        .where('products.manufacturer_id', manufacturerId)
        .count('tokens.id as count')
        .first();

      // Get validated tokens
      const validatedTokens = await db('tokens')
        .join('products', 'tokens.product_id', 'products.id')
        .join('token_validations', 'tokens.id', 'token_validations.token_id')
        .where('products.manufacturer_id', manufacturerId)
        .countDistinct('tokens.id as count')
        .first();

      // Get reported counterfeits
      const reportedCounterfeits = await db('counterfeit_reports')
        .join('tokens', 'counterfeit_reports.token_id', 'tokens.id')
        .join('products', 'tokens.product_id', 'products.id')
        .where('products.manufacturer_id', manufacturerId)
        .count('counterfeit_reports.id as count')
        .first();

      // Get geographic distribution
      const geoDistribution = await db('token_validations')
        .select('location', db.raw('COUNT(*) as count'))
        .join('tokens', 'token_validations.token_id', 'tokens.id')
        .join('products', 'tokens.product_id', 'products.id')
        .where('products.manufacturer_id', manufacturerId)
        .whereNotNull('location')
        .groupBy('location')
        .orderBy('count', 'desc')
        .limit(10);

      res.json({
        success: true,
        data: {
          total_tokens: parseInt(totalTokens.count),
          validated_tokens: parseInt(validatedTokens.count),
          reported_counterfeits: parseInt(reportedCounterfeits.count),
          validation_rate: totalTokens.count > 0 ? 
            ((validatedTokens.count / totalTokens.count) * 100).toFixed(2) : 0,
          geographic_distribution: geoDistribution
        }
      });
    } catch (error) {
      console.error('Error getting supply chain analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Add supply chain event
  async addEvent(req, res) {
    try {
      const { token_id, event_type, location, notes } = req.body;

      // Verify token exists and user has access
      const token = await db('tokens')
        .join('products', 'tokens.product_id', 'products.id')
        .select('tokens.*', 'products.manufacturer_id')
        .where('tokens.id', token_id)
        .first();

      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found'
        });
      }

      // Check permissions
      if (req.user.role === 'manufacturer' && req.user.manufacturer_id !== token.manufacturer_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Add event (this would typically go to a supply_chain_events table)
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Supply chain event added successfully'
      });
    } catch (error) {
      console.error('Error adding supply chain event:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get token events
  async getTokenEvents(req, res) {
    try {
      const { tokenId } = req.params;

      // Get token details
      const token = await db('tokens')
        .join('products', 'tokens.product_id', 'products.id')
        .select('tokens.*', 'products.manufacturer_id')
        .where('tokens.id', tokenId)
        .first();

      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found'
        });
      }

      // Check permissions
      if (req.user.role === 'manufacturer' && req.user.manufacturer_id !== token.manufacturer_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get events (mock data for now)
      const events = [
        {
          id: 1,
          event_type: 'manufactured',
          location: 'Factory Floor A',
          timestamp: token.created_at,
          notes: 'Product manufactured and NFC tag attached'
        },
        {
          id: 2,
          event_type: 'quality_check',
          location: 'QC Department',
          timestamp: token.created_at,
          notes: 'Quality control passed'
        }
      ];

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('Error getting token events:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = supplyChainController;