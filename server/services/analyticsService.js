const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AnalyticsService {
  // Get manufacturer dashboard analytics
  async getManufacturerAnalytics(manufacturerId, dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const analytics = {
      overview: {},
      channelPerformance: [],
      productMetrics: [],
      counterfeitTrends: [],
      customerComplaints: [],
      geographicDistribution: [],
      recommendations: []
    };

    // Overview metrics
    const overview = await this.getOverviewMetrics(manufacturerId, startDate);
    analytics.overview = overview;

    // Channel performance
    const channels = await this.getChannelPerformance(manufacturerId, startDate);
    analytics.channelPerformance = channels;

    // Product metrics
    const products = await this.getProductMetrics(manufacturerId, startDate);
    analytics.productMetrics = products;

    // Counterfeit trends
    const trends = await this.getCounterfeitTrends(manufacturerId, startDate);
    analytics.counterfeitTrends = trends;

    // Customer complaints
    const complaints = await this.getCustomerComplaints(manufacturerId, startDate);
    analytics.customerComplaints = complaints;

    // Geographic distribution
    const geographic = await this.getGeographicDistribution(manufacturerId);
    analytics.geographicDistribution = geographic;

    // AI-powered recommendations
    const recommendations = await this.generateRecommendations(analytics);
    analytics.recommendations = recommendations;

    return analytics;
  }

  async getOverviewMetrics(manufacturerId, startDate) {
    // Total products
    const totalProducts = await knex('products')
      .where('manufacturer_id', manufacturerId)
      .count('* as count')
      .first();

    // Total verifications
    const totalVerifications = await knex('supply_chain_events as sce')
      .join('nfc_tokens as nt', 'sce.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('sce.event_type', 'validation')
      .where('sce.timestamp', '>=', startDate)
      .count('* as count')
      .first();

    // Counterfeit incidents
    const counterfeitIncidents = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('cr.status', 'confirmed')
      .where('cr.created_at', '>=', startDate)
      .count('* as count')
      .first();

    // Authentication rate
    const totalTokens = await knex('nfc_tokens')
      .where('manufacturer_id', manufacturerId)
      .count('* as count')
      .first();

    const validatedTokens = await knex('nfc_tokens')
      .where('manufacturer_id', manufacturerId)
      .where('status', 'validated')
      .count('* as count')
      .first();

    const authRate = totalTokens.count > 0 
      ? (validatedTokens.count / totalTokens.count * 100).toFixed(2)
      : 0;

    // Customer satisfaction (from complaints)
    const totalComplaints = await knex('customer_complaints')
      .where('manufacturer_id', manufacturerId)
      .where('created_at', '>=', startDate)
      .count('* as count')
      .first();

    const resolvedComplaints = await knex('customer_complaints')
      .where('manufacturer_id', manufacturerId)
      .where('status', 'resolved')
      .where('created_at', '>=', startDate)
      .count('* as count')
      .first();

    const satisfactionRate = totalComplaints.count > 0
      ? (resolvedComplaints.count / totalComplaints.count * 100).toFixed(2)
      : 100;

    return {
      totalProducts: parseInt(totalProducts.count),
      totalVerifications: parseInt(totalVerifications.count),
      counterfeitIncidents: parseInt(counterfeitIncidents.count),
      authenticationRate: parseFloat(authRate),
      customerSatisfaction: parseFloat(satisfactionRate),
      period: `Last ${dateRange} days`
    };
  }

  async getChannelPerformance(manufacturerId, startDate) {
    // Get latest channel analytics
    const channels = await knex('channel_analytics')
      .where('manufacturer_id', manufacturerId)
      .where('analysis_date', '>=', startDate)
      .orderBy('trust_score', 'desc');

    // Group by channel type and calculate metrics
    const channelMetrics = {};
    
    channels.forEach(channel => {
      if (!channelMetrics[channel.channel_type]) {
        channelMetrics[channel.channel_type] = {
          type: channel.channel_type,
          totalSales: 0,
          counterfeitIncidents: 0,
          avgTrustScore: 0,
          count: 0,
          regions: new Set()
        };
      }

      const metric = channelMetrics[channel.channel_type];
      metric.totalSales += channel.total_sales;
      metric.counterfeitIncidents += channel.counterfeit_incidents;
      metric.avgTrustScore += channel.trust_score;
      metric.count += 1;
      metric.regions.add(channel.region);
    });

    // Calculate averages and format
    const formattedChannels = Object.values(channelMetrics).map(metric => ({
      channelType: metric.type,
      totalSales: metric.totalSales,
      counterfeitIncidents: metric.counterfeitIncidents,
      avgTrustScore: (metric.avgTrustScore / metric.count).toFixed(4),
      regionsCovered: Array.from(metric.regions).length,
      performance: metric.avgTrustScore / metric.count > 0.8 ? 'Good' : 
                   metric.avgTrustScore / metric.count > 0.6 ? 'Fair' : 'Poor',
      recommendation: metric.counterfeitIncidents > 10 ? 'Requires immediate attention' :
                      metric.counterfeitIncidents > 5 ? 'Monitor closely' : 'Performing well'
    }));

    return formattedChannels.sort((a, b) => b.avgTrustScore - a.avgTrustScore);
  }

  async getProductMetrics(manufacturerId, startDate) {
    const products = await knex('products as p')
      .leftJoin('nfc_tokens as nt', 'p.id', 'nt.product_id')
      .leftJoin('supply_chain_events as sce', function() {
        this.on('nt.id', '=', 'sce.token_id')
            .andOn('sce.event_type', '=', knex.raw('?', ['validation']))
            .andOn('sce.timestamp', '>=', knex.raw('?', [startDate]));
      })
      .leftJoin('counterfeit_reports as cr', function() {
        this.on('nt.id', '=', 'cr.token_id')
            .andOn('cr.status', '=', knex.raw('?', ['confirmed']))
            .andOn('cr.created_at', '>=', knex.raw('?', [startDate]));
      })
      .where('p.manufacturer_id', manufacturerId)
      .groupBy('p.id', 'p.name', 'p.category')
      .select(
        'p.id',
        'p.name',
        'p.category',
        knex.raw('COUNT(DISTINCT nt.id) as total_units'),
        knex.raw('COUNT(DISTINCT sce.id) as verifications'),
        knex.raw('COUNT(DISTINCT cr.id) as counterfeit_reports')
      );

    return products.map(product => ({
      productId: product.id,
      name: product.name,
      category: product.category,
      totalUnits: parseInt(product.total_units),
      verifications: parseInt(product.verifications),
      counterfeitReports: parseInt(product.counterfeit_reports),
      verificationRate: product.total_units > 0 
        ? ((product.verifications / product.total_units) * 100).toFixed(2)
        : 0,
      riskLevel: product.counterfeit_reports > 5 ? 'High' :
                 product.counterfeit_reports > 2 ? 'Medium' : 'Low'
    }));
  }

  async getCounterfeitTrends(manufacturerId, startDate) {
    // Get daily counterfeit reports
    const dailyReports = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('cr.created_at', '>=', startDate)
      .groupBy(knex.raw('DATE(cr.created_at)'))
      .select(
        knex.raw('DATE(cr.created_at) as date'),
        knex.raw('COUNT(*) as total_reports'),
        knex.raw('SUM(CASE WHEN cr.status = "confirmed" THEN 1 ELSE 0 END) as confirmed_reports')
      )
      .orderBy('date');

    // Get patterns from ML analysis
    const patterns = await knex('fraud_patterns')
      .where('is_active', true)
      .select('pattern_name', 'geographic_hotspots', 'time_patterns', 'product_categories');

    // Identify relevant patterns for this manufacturer
    const relevantPatterns = [];
    for (const pattern of patterns) {
      const categories = JSON.parse(pattern.product_categories);
      const manufacturerProducts = await knex('products')
        .where('manufacturer_id', manufacturerId)
        .whereIn('category', categories)
        .count('* as count')
        .first();

      if (manufacturerProducts.count > 0) {
        relevantPatterns.push({
          patternName: pattern.pattern_name,
          hotspots: JSON.parse(pattern.geographic_hotspots),
          timePatterns: JSON.parse(pattern.time_patterns),
          relevance: 'High'
        });
      }
    }

    return {
      dailyTrends: dailyReports,
      detectedPatterns: relevantPatterns,
      summary: {
        totalReports: dailyReports.reduce((sum, day) => sum + parseInt(day.total_reports), 0),
        confirmedReports: dailyReports.reduce((sum, day) => sum + parseInt(day.confirmed_reports), 0),
        averageDaily: (dailyReports.reduce((sum, day) => sum + parseInt(day.total_reports), 0) / dailyReports.length).toFixed(2)
      }
    };
  }

  async getCustomerComplaints(manufacturerId, startDate) {
    const complaints = await knex('customer_complaints as cc')
      .leftJoin('products as p', 'cc.product_id', 'p.id')
      .where('cc.manufacturer_id', manufacturerId)
      .where('cc.created_at', '>=', startDate)
      .select(
        'cc.*',
        'p.name as product_name',
        'p.category as product_category'
      )
      .orderBy('cc.created_at', 'desc');

    // Group by category
    const complaintsByCategory = {};
    const complaintsBySeverity = {};
    const complaintsByStatus = {};

    complaints.forEach(complaint => {
      // By category
      if (!complaintsByCategory[complaint.category]) {
        complaintsByCategory[complaint.category] = 0;
      }
      complaintsByCategory[complaint.category]++;

      // By severity
      if (!complaintsBySeverity[complaint.severity]) {
        complaintsBySeverity[complaint.severity] = 0;
      }
      complaintsBySeverity[complaint.severity]++;

      // By status
      if (!complaintsByStatus[complaint.status]) {
        complaintsByStatus[complaint.status] = 0;
      }
      complaintsByStatus[complaint.status]++;
    });

    // Calculate resolution time for resolved complaints
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const avgResolutionTime = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, c) => {
          const created = new Date(c.created_at);
          const updated = new Date(c.updated_at);
          return sum + (updated - created) / (1000 * 60 * 60 * 24); // Days
        }, 0) / resolvedComplaints.length
      : 0;

    return {
      recentComplaints: complaints.slice(0, 10).map(c => ({
        id: c.id,
        product: c.product_name,
        category: c.category,
        severity: c.severity,
        status: c.status,
        description: c.description,
        createdAt: c.created_at
      })),
      statistics: {
        total: complaints.length,
        byCategory: complaintsByCategory,
        bySeverity: complaintsBySeverity,
        byStatus: complaintsByStatus,
        avgResolutionTimeDays: avgResolutionTime.toFixed(2)
      }
    };
  }

  async getGeographicDistribution(manufacturerId) {
    // Get verification locations
    const verifications = await knex('supply_chain_events as sce')
      .join('nfc_tokens as nt', 'sce.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('sce.event_type', 'validation')
      .whereNotNull('sce.location')
      .select(
        knex.raw('ST_X(sce.location) as longitude'),
        knex.raw('ST_Y(sce.location) as latitude')
      )
      .limit(1000);

    // Get counterfeit report locations
    const counterfeits = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('cr.status', 'confirmed')
      .whereNotNull('cr.location')
      .select(
        knex.raw('ST_X(cr.location) as longitude'),
        knex.raw('ST_Y(cr.location) as latitude')
      )
      .limit(500);

    // Group by provinces (simplified - would need proper geocoding in production)
    const provinceData = {
      'Gauteng': { verifications: 0, counterfeits: 0, bounds: { lat: [-26.2, -25.7], lng: [27.8, 28.3] } },
      'Western Cape': { verifications: 0, counterfeits: 0, bounds: { lat: [-34.4, -33.5], lng: [18.3, 19.0] } },
      'KwaZulu-Natal': { verifications: 0, counterfeits: 0, bounds: { lat: [-30.0, -29.0], lng: [30.5, 31.5] } }
    };

    // Assign to provinces based on coordinates
    verifications.forEach(v => {
      for (const [province, data] of Object.entries(provinceData)) {
        if (v.latitude >= data.bounds.lat[0] && v.latitude <= data.bounds.lat[1] &&
            v.longitude >= data.bounds.lng[0] && v.longitude <= data.bounds.lng[1]) {
          data.verifications++;
          break;
        }
      }
    });

    counterfeits.forEach(c => {
      for (const [province, data] of Object.entries(provinceData)) {
        if (c.latitude >= data.bounds.lat[0] && c.latitude <= data.bounds.lat[1] &&
            c.longitude >= data.bounds.lng[0] && c.longitude <= data.bounds.lng[1]) {
          data.counterfeits++;
          break;
        }
      }
    });

    return Object.entries(provinceData).map(([province, data]) => ({
      province,
      verifications: data.verifications,
      counterfeits: data.counterfeits,
      riskLevel: data.counterfeits > 10 ? 'High' :
                 data.counterfeits > 5 ? 'Medium' : 'Low',
      counterfeitRate: data.verifications > 0 
        ? ((data.counterfeits / data.verifications) * 100).toFixed(2)
        : 0
    }));
  }

  async generateRecommendations(analytics) {
    const recommendations = [];

    // Channel recommendations
    const poorChannels = analytics.channelPerformance.filter(c => c.performance === 'Poor');
    if (poorChannels.length > 0) {
      recommendations.push({
        type: 'channel',
        priority: 'high',
        title: 'Channel Performance Alert',
        description: `${poorChannels.length} distribution channels are performing poorly with high counterfeit rates.`,
        action: 'Review and potentially terminate partnerships with underperforming channels.',
        impact: 'Could reduce counterfeit incidents by up to 40%'
      });
    }

    // Product recommendations
    const highRiskProducts = analytics.productMetrics.filter(p => p.riskLevel === 'High');
    if (highRiskProducts.length > 0) {
      recommendations.push({
        type: 'product',
        priority: 'high',
        title: 'High-Risk Products Identified',
        description: `${highRiskProducts.length} products have elevated counterfeit rates.`,
        action: 'Implement enhanced security features or packaging redesign for these products.',
        impact: 'Protect brand reputation and consumer safety'
      });
    }

    // Geographic recommendations
    const highRiskRegions = analytics.geographicDistribution.filter(g => g.riskLevel === 'High');
    if (highRiskRegions.length > 0) {
      recommendations.push({
        type: 'geographic',
        priority: 'medium',
        title: 'Geographic Hotspots',
        description: `${highRiskRegions.length} provinces show high counterfeit activity.`,
        action: 'Increase monitoring and enforcement in these regions.',
        impact: 'Target enforcement resources more effectively'
      });
    }

    // Customer satisfaction
    if (analytics.overview.customerSatisfaction < 80) {
      recommendations.push({
        type: 'customer',
        priority: 'medium',
        title: 'Customer Satisfaction Below Target',
        description: `Current satisfaction rate is ${analytics.overview.customerSatisfaction}%.`,
        action: 'Implement faster complaint resolution processes and proactive communication.',
        impact: 'Improve brand loyalty and reduce negative reviews'
      });
    }

    // Authentication rate
    if (analytics.overview.authenticationRate < 50) {
      recommendations.push({
        type: 'authentication',
        priority: 'high',
        title: 'Low Product Authentication Rate',
        description: `Only ${analytics.overview.authenticationRate}% of products are being verified by consumers.`,
        action: 'Launch consumer education campaign about product verification.',
        impact: 'Increase counterfeit detection and consumer engagement'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Update channel analytics (called periodically)
  async updateChannelAnalytics() {
    const manufacturers = await knex('manufacturers').select('id');
    
    for (const manufacturer of manufacturers) {
      const channels = await knex('supply_chain_events as sce')
        .join('nfc_tokens as nt', 'sce.token_id', 'nt.id')
        .where('nt.manufacturer_id', manufacturer.id)
        .where('sce.timestamp', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .groupBy('sce.metadata')
        .select(
          'sce.metadata',
          knex.raw('COUNT(*) as event_count')
        );

      // Process and store channel analytics
      // This is simplified - in production would parse metadata for channel info
      console.log(`Updated analytics for manufacturer ${manufacturer.id}`);
    }
  }

  // Get real-time alerts for manufacturer
  async getRealTimeAlerts(manufacturerId) {
    const alerts = [];

    // Check for sudden spike in counterfeit reports
    const recentReports = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('cr.created_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
      .count('* as count')
      .first();

    const avgDailyReports = await knex('counterfeit_reports as cr')
      .join('nfc_tokens as nt', 'cr.token_id', 'nt.id')
      .where('nt.manufacturer_id', manufacturerId)
      .where('cr.created_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
      .count('* as count')
      .first();

    const avgDaily = avgDailyReports.count / 30;
    
    if (recentReports.count > avgDaily * 2) {
      alerts.push({
        type: 'counterfeit_spike',
        severity: 'high',
        message: `Counterfeit reports have spiked to ${recentReports.count} in the last 24 hours (${Math.round((recentReports.count / avgDaily - 1) * 100)}% above average)`,
        timestamp: new Date()
      });
    }

    // Check for new repeat offenders
    const newOffenders = await knex('repeat_offenders')
      .where('created_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
      .where('risk_score', '>', 0.7)
      .count('* as count')
      .first();

    if (newOffenders.count > 0) {
      alerts.push({
        type: 'repeat_offenders',
        severity: 'medium',
        message: `${newOffenders.count} new high-risk repeat offenders detected`,
        timestamp: new Date()
      });
    }

    return alerts;
  }
}

module.exports = new AnalyticsService();