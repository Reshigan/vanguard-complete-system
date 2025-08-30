const db = require('../config/mockDatabase');

const dashboardController = {
  // Get dashboard statistics
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let stats = {};

      if (userRole === 'consumer') {
        // Consumer dashboard stats
        const validations = await db('token_validations')
          .where('user_id', userId)
          .count('id as count')
          .first();

        const reports = await db('counterfeit_reports')
          .where('user_id', userId)
          .count('id as count')
          .first();

        const points = await db('users')
          .select('reward_points')
          .where('id', userId)
          .first();

        stats = {
          total_validations: parseInt(validations.count),
          total_reports: parseInt(reports.count),
          reward_points: points?.reward_points || 0,
          recent_activity: await db('token_validations')
            .select('token_validations.*', 'products.name as product_name')
            .join('tokens', 'token_validations.token_id', 'tokens.id')
            .join('products', 'tokens.product_id', 'products.id')
            .where('token_validations.user_id', userId)
            .orderBy('validated_at', 'desc')
            .limit(5)
        };
      } else if (userRole === 'manufacturer') {
        // Manufacturer dashboard stats
        const manufacturerId = req.user.manufacturer_id;

        const totalProducts = await db('products')
          .where('manufacturer_id', manufacturerId)
          .count('id as count')
          .first();

        const totalTokens = await db('tokens')
          .join('products', 'tokens.product_id', 'products.id')
          .where('products.manufacturer_id', manufacturerId)
          .count('tokens.id as count')
          .first();

        const validatedTokens = await db('tokens')
          .join('products', 'tokens.product_id', 'products.id')
          .join('token_validations', 'tokens.id', 'token_validations.token_id')
          .where('products.manufacturer_id', manufacturerId)
          .countDistinct('tokens.id as count')
          .first();

        const counterfeits = await db('counterfeit_reports')
          .join('tokens', 'counterfeit_reports.token_id', 'tokens.id')
          .join('products', 'tokens.product_id', 'products.id')
          .where('products.manufacturer_id', manufacturerId)
          .count('counterfeit_reports.id as count')
          .first();

        stats = {
          total_products: parseInt(totalProducts.count),
          total_tokens: parseInt(totalTokens.count),
          validated_tokens: parseInt(validatedTokens.count),
          reported_counterfeits: parseInt(counterfeits.count),
          validation_rate: totalTokens.count > 0 ? 
            ((validatedTokens.count / totalTokens.count) * 100).toFixed(2) : 0
        };
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get recent activity
  async getRecentActivity(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let activity = [];

      if (userRole === 'consumer') {
        // Get recent validations and reports
        const validations = await db('token_validations')
          .select('token_validations.*', 'products.name as product_name', 'manufacturers.name as manufacturer_name')
          .join('tokens', 'token_validations.token_id', 'tokens.id')
          .join('products', 'tokens.product_id', 'products.id')
          .join('manufacturers', 'products.manufacturer_id', 'manufacturers.id')
          .where('token_validations.user_id', userId)
          .orderBy('validated_at', 'desc')
          .limit(10);

        activity = validations.map(v => ({
          type: 'validation',
          description: `Validated ${v.product_name} by ${v.manufacturer_name}`,
          timestamp: v.validated_at,
          status: v.is_valid ? 'success' : 'warning'
        }));
      } else if (userRole === 'manufacturer') {
        // Get recent product activities
        const manufacturerId = req.user.manufacturer_id;
        
        const recentValidations = await db('token_validations')
          .select('token_validations.*', 'products.name as product_name')
          .join('tokens', 'token_validations.token_id', 'tokens.id')
          .join('products', 'tokens.product_id', 'products.id')
          .where('products.manufacturer_id', manufacturerId)
          .orderBy('validated_at', 'desc')
          .limit(10);

        activity = recentValidations.map(v => ({
          type: 'validation',
          description: `${v.product_name} validated by consumer`,
          timestamp: v.validated_at,
          status: v.is_valid ? 'success' : 'warning'
        }));
      }

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Error getting recent activity:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = dashboardController;