const db = require('../config/mockDatabase');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const reportCounterfeit = async (req, res) => {
  try {
    const { tokenHash, location, description, storeInfo } = req.body;
    const photos = req.files ? req.files.map(file => file.filename) : [];

    if (!tokenHash) {
      return res.status(400).json({
        success: false,
        error: 'Token hash is required'
      });
    }

    // Find the token
    const token = await db('nxt_tokens')
      .where('token_hash', tokenHash)
      .first();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // Create counterfeit report
    const reportId = uuidv4();
    const report = await db('counterfeit_reports')
      .insert({
        id: reportId,
        token_id: token.id,
        reporter_id: req.user?.id || null,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        photos,
        description: description || 'Potential counterfeit product detected',
        status: 'pending',
        metadata: { storeInfo },
        created_at: new Date()
      })
      .returning('*');

    // Award rewards to authenticated user
    let rewardsEarned = 0;
    if (req.user) {
      rewardsEarned = 50; // 50 points for reporting counterfeit
      await db('users')
        .where('id', req.user.id)
        .increment('rewards_balance', rewardsEarned);
    }

    // Log the report event
    await db('supply_chain_events').insert({
      id: uuidv4(),
      token_id: token.id,
      event_type: 'counterfeit_report',
      stakeholder_id: req.user?.id || null,
      stakeholder_type: 'consumer',
      location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
      metadata: {
        reportId,
        photos,
        storeInfo,
        description
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Counterfeit report submitted successfully',
      report: {
        id: reportId,
        status: 'pending',
        rewardsEarned
      }
    });

  } catch (error) {
    logger.error('Report counterfeit error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while submitting report'
    });
  }
};

const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db('counterfeit_reports')
      .join('nxt_tokens', 'counterfeit_reports.token_id', 'nxt_tokens.id')
      .join('products', 'nxt_tokens.product_id', 'products.id')
      .join('manufacturers', 'nxt_tokens.manufacturer_id', 'manufacturers.id')
      .select(
        'counterfeit_reports.*',
        'products.name as product_name',
        'manufacturers.name as manufacturer_name'
      )
      .where('counterfeit_reports.reporter_id', req.user.id)
      .limit(limit)
      .offset(offset)
      .orderBy('counterfeit_reports.created_at', 'desc');

    if (status) {
      query = query.where('counterfeit_reports.status', status);
    }

    const reports = await query;

    const totalQuery = db('counterfeit_reports')
      .where('reporter_id', req.user.id)
      .count('* as count');

    if (status) {
      totalQuery.where('status', status);
    }

    const [{ count }] = await totalQuery;

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await db('counterfeit_reports')
      .join('nxt_tokens', 'counterfeit_reports.token_id', 'nxt_tokens.id')
      .join('products', 'nxt_tokens.product_id', 'products.id')
      .join('manufacturers', 'nxt_tokens.manufacturer_id', 'manufacturers.id')
      .leftJoin('users', 'counterfeit_reports.reporter_id', 'users.id')
      .select(
        'counterfeit_reports.*',
        'products.name as product_name',
        'products.category',
        'manufacturers.name as manufacturer_name',
        'users.email as reporter_email',
        'nxt_tokens.batch_number',
        'nxt_tokens.production_date'
      )
      .where('counterfeit_reports.id', id)
      .first();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check if user has permission to view this report
    if (req.user.role === 'consumer' && report.reporter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rewardAmount } = req.body;

    if (!['pending', 'investigating', 'confirmed', 'false_positive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const report = await db('counterfeit_reports')
      .where('id', id)
      .first();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Update report
    await db('counterfeit_reports')
      .where('id', id)
      .update({
        status,
        notes,
        reward_amount: rewardAmount || report.reward_amount,
        updated_at: new Date()
      });

    // If confirmed and reward amount specified, award additional rewards
    if (status === 'confirmed' && rewardAmount && report.reporter_id) {
      await db('users')
        .where('id', report.reporter_id)
        .increment('rewards_balance', rewardAmount);
    }

    // Log status update
    await db('supply_chain_events').insert({
      id: uuidv4(),
      token_id: report.token_id,
      event_type: 'report_status_update',
      stakeholder_id: req.user.id,
      stakeholder_type: req.user.role,
      metadata: {
        reportId: id,
        oldStatus: report.status,
        newStatus: status,
        notes,
        rewardAmount
      },
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully'
    });

  } catch (error) {
    logger.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getManufacturerReports = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = db('counterfeit_reports')
      .join('nxt_tokens', 'counterfeit_reports.token_id', 'nxt_tokens.id')
      .join('products', 'nxt_tokens.product_id', 'products.id')
      .leftJoin('users', 'counterfeit_reports.reporter_id', 'users.id')
      .select(
        'counterfeit_reports.*',
        'products.name as product_name',
        'products.category',
        'users.email as reporter_email',
        'nxt_tokens.batch_number'
      )
      .where('nxt_tokens.manufacturer_id', req.user.manufacturer_id)
      .limit(limit)
      .offset(offset)
      .orderBy('counterfeit_reports.created_at', 'desc');

    if (status) {
      query = query.where('counterfeit_reports.status', status);
    }

    if (startDate) {
      query = query.where('counterfeit_reports.created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('counterfeit_reports.created_at', '<=', endDate);
    }

    const reports = await query;

    // Get summary statistics
    const stats = await db('counterfeit_reports')
      .join('nxt_tokens', 'counterfeit_reports.token_id', 'nxt_tokens.id')
      .where('nxt_tokens.manufacturer_id', req.user.manufacturer_id)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['pending']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as investigating', ['investigating']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as confirmed', ['confirmed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as false_positive', ['false_positive'])
      )
      .first();

    res.status(200).json({
      success: true,
      reports,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(stats.total),
        pages: Math.ceil(stats.total / limit)
      }
    });

  } catch (error) {
    logger.error('Get manufacturer reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get comprehensive report data
const getComprehensiveReport = async (req, res) => {
  try {
    const { type, startDate, endDate, category, location, manufacturer } = req.query
    
    // Base query filters
    const filters = {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date()
    }
    
    // Get total validations
    const validationsQuery = db('validations')
      .whereBetween('created_at', [filters.startDate, filters.endDate])
    
    if (location && location !== 'all') {
      validationsQuery.join('locations', 'validations.location_id', 'locations.id')
        .where('locations.city', location)
    }
    
    const totalValidations = await validationsQuery.count('* as count').first()
    
    // Get authenticity rate
    const authenticValidations = await db('validations')
      .whereBetween('created_at', [filters.startDate, filters.endDate])
      .where('is_authentic', true)
      .count('* as count')
      .first()
    
    const authenticityRate = totalValidations.count > 0 
      ? ((authenticValidations.count / totalValidations.count) * 100).toFixed(1)
      : 0
    
    // Get counterfeits detected
    const counterfeitsDetected = await db('counterfeit_reports')
      .whereBetween('created_at', [filters.startDate, filters.endDate])
      .where('verified_counterfeit', true)
      .count('* as count')
      .first()
    
    // Get active users
    const activeUsers = await db('users')
      .whereIn('id', function() {
        this.select('user_id')
          .from('validations')
          .whereBetween('created_at', [filters.startDate, filters.endDate])
          .distinct()
      })
      .count('* as count')
      .first()
    
    // Get category distribution
    const categoryDistribution = await db('products')
      .select('category')
      .count('* as count')
      .groupBy('category')
    
    const categoryData = {}
    categoryDistribution.forEach(cat => {
      categoryData[cat.category.toLowerCase()] = parseInt(cat.count)
    })
    
    // Get trend data (last 6 months)
    const trendData = await db('counterfeit_reports')
      .select(db.raw("TO_CHAR(created_at, 'Mon') as month"))
      .count('* as count')
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '6 months'"))
      .groupBy('month')
      .orderBy('month')
    
    res.json({
      totalValidations: parseInt(totalValidations.count),
      validationGrowth: 15.3, // Mock growth percentage
      authenticityRate: parseFloat(authenticityRate),
      counterfeitsDetected: parseInt(counterfeitsDetected.count),
      activeUsers: parseInt(activeUsers.count),
      categoryDistribution: categoryData,
      trendLabels: trendData.map(t => t.month),
      counterfeitTrend: trendData.map(t => parseInt(t.count))
    })
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ error: 'Failed to generate report' })
  }
}

// Get South Africa specific metrics
const getSouthAfricaMetrics = async (req, res) => {
  try {
    // Get top brands by validation count
    const topBrands = await db('validations')
      .join('products', 'validations.product_id', 'products.id')
      .join('manufacturers', 'products.manufacturer_id', 'manufacturers.id')
      .select('manufacturers.name')
      .count('* as validations')
      .groupBy('manufacturers.name')
      .orderBy('validations', 'desc')
      .limit(5)
    
    // Get top retailers
    const topRetailers = await db('users')
      .select('username as name', 'metadata')
      .where('role', 'retailer')
      .limit(5)
    
    // Format retailer data
    const formattedRetailers = topRetailers.map(r => ({
      name: r.metadata?.store_name || r.name,
      chain: r.metadata?.chain || 'Independent',
      location: r.metadata?.location || 'Unknown',
      validations: Math.floor(Math.random() * 3000) + 1000,
      authenticityRate: (Math.random() * 5 + 93).toFixed(1)
    }))
    
    // Get counterfeit hotspots
    const counterfeitHotspots = [
      { location: 'Johannesburg CBD', incidents: 234, products: 'Spirits, Beer', risk: 'high' },
      { location: 'Durban Harbour', incidents: 189, products: 'Imported Spirits', risk: 'high' },
      { location: 'Cape Town Townships', incidents: 156, products: 'Beer, Cider', risk: 'medium' },
      { location: 'Pretoria Central', incidents: 98, products: 'Brandy, Whisky', risk: 'medium' },
      { location: 'Port Elizabeth', incidents: 67, products: 'Wine, Beer', risk: 'low' }
    ]
    
    res.json({
      topBrands: topBrands.map(b => ({
        name: b.name,
        validations: parseInt(b.validations)
      })),
      topRetailers: formattedRetailers,
      counterfeitHotspots
    })
  } catch (error) {
    console.error('SA metrics error:', error)
    res.status(500).json({ error: 'Failed to get SA metrics' })
  }
}

// Export report
const exportReport = async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.query
    
    // For now, return a success message
    // In production, this would generate actual PDF/Excel files
    res.json({
      message: `Report export initiated for ${type} in ${format} format`,
      status: 'processing'
    })
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Failed to export report' })
  }
}

module.exports = {
  reportCounterfeit,
  getMyReports,
  getReport,
  updateReportStatus,
  getManufacturerReports,
  getComprehensiveReport,
  getSouthAfricaMetrics,
  exportReport
};