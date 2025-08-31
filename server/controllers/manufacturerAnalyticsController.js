const knex = require('../config/database');
const logger = require('../utils/logger');
const anomalyDetection = require('../services/ml/anomalyDetection');
const aiChatService = require('../services/ai/chatService');

class ManufacturerAnalyticsController {
  // Get comprehensive manufacturer dashboard
  async getDashboard(req, res) {
    try {
      const manufacturerId = req.user.manufacturer_id || req.query.manufacturer_id;
      const timeframe = req.query.timeframe || '30days';
      
      if (!manufacturerId) {
        return res.status(400).json({ success: false, error: 'Manufacturer ID required' });
      }
      
      // Get date range
      const { startDate, endDate } = this.getDateRange(timeframe);
      
      // Fetch all analytics data in parallel
      const [
        overview,
        channelAnalysis,
        complaints,
        supplyChainMetrics,
        predictions,
        alerts
      ] = await Promise.all([
        this.getOverviewMetrics(manufacturerId, startDate, endDate),
        this.getChannelAnalysis(manufacturerId, startDate, endDate),
        this.getComplaintsAnalysis(manufacturerId, startDate, endDate),
        this.getSupplyChainMetrics(manufacturerId, startDate, endDate),
        this.getPredictiveInsights(manufacturerId),
        this.getActiveAlerts(manufacturerId)
      ]);
      
      res.json({
        success: true,
        data: {
          timeframe,
          overview,
          channels: channelAnalysis,
          complaints,
          supplyChain: supplyChainMetrics,
          predictions,
          alerts,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      logger.error('Error fetching manufacturer dashboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
  }

  // Get detailed channel analysis
  async getChannelAnalysis(manufacturerId, startDate, endDate) {
    try {
      // Get all channels with performance metrics
      const channels = await knex('distribution_channels as dc')
        .leftJoin(
          knex('supply_chain_events as sce')
            .join('nfc_tokens as nt', 'sce.token_id', 'nt.id')
            .where('nt.manufacturer_id', manufacturerId)
            .whereBetween('sce.timestamp', [startDate, endDate])
            .select('sce.metadata')
            .whereRaw("sce.metadata->>'channel_id' = dc.id::text")
            .groupBy(knex.raw("sce.metadata->>'channel_id'"))
            .select(
              knex.raw("sce.metadata->>'channel_id' as channel_id"),
              knex.raw('COUNT(*) as total_events'),
              knex.raw("COUNT(CASE WHEN sce.event_type = 'validation' THEN 1 END) as validations"),
              knex.raw("COUNT(CASE WHEN sce.event_type = 'counterfeit_report' THEN 1 END) as counterfeits")
            )
            .as('events'),
          'dc.id',
          knex.raw("events.channel_id::uuid")
        )
        .select(
          'dc.*',
          'events.total_events',
          'events.validations',
          'events.counterfeits'
        )
        .orderBy('dc.trust_score', 'asc');
      
      // Categorize channels
      const categorizedChannels = {
        high_risk: [],
        medium_risk: [],
        low_risk: [],
        trusted: []
      };
      
      for (const channel of channels) {
        // Calculate additional metrics
        const metrics = {
          ...channel,
          counterfeit_rate: channel.validations > 0 
            ? (channel.counterfeits / channel.validations) * 100 
            : 0,
          performance_score: this.calculateChannelPerformance(channel),
          risk_factors: await this.identifyRiskFactors(channel),
          recommendations: this.getChannelRecommendations(channel)
        };
        
        // Categorize based on trust score
        if (channel.trust_score < 0.3) {
          categorizedChannels.high_risk.push(metrics);
        } else if (channel.trust_score < 0.5) {
          categorizedChannels.medium_risk.push(metrics);
        } else if (channel.trust_score < 0.8) {
          categorizedChannels.low_risk.push(metrics);
        } else {
          categorizedChannels.trusted.push(metrics);
        }
      }
      
      // Get geographic distribution
      const geographicAnalysis = await this.getGeographicDistribution(channels);
      
      return {
        summary: {
          total_channels: channels.length,
          high_risk_count: categorizedChannels.high_risk.length,
          average_trust_score: channels.reduce((sum, c) => sum + c.trust_score, 0) / channels.length,
          total_validations: channels.reduce((sum, c) => sum + (c.validations || 0), 0),
          total_counterfeits: channels.reduce((sum, c) => sum + (c.counterfeits || 0), 0)
        },
        channels: categorizedChannels,
        geographic: geographicAnalysis,
        trends: await this.getChannelTrends(manufacturerId, startDate, endDate)
      };
    } catch (error) {
      logger.error('Error in channel analysis:', error);
      throw error;
    }
  }

  // Get customer complaints analysis
  async getComplaintsAnalysis(manufacturerId, startDate, endDate) {
    try {
      // Get all complaints
      const complaints = await knex('customer_complaints')
        .where('manufacturer_id', manufacturerId)
        .whereBetween('created_at', [startDate, endDate])
        .orderBy('created_at', 'desc');
      
      // Categorize by type and status
      const categorization = {
        by_type: {},
        by_status: {},
        by_priority: {},
        by_product: {}
      };
      
      // Get product names for grouping
      const products = await knex('products')
        .where('manufacturer_id', manufacturerId)
        .select('id', 'name');
      
      const productMap = products.reduce((map, p) => {
        map[p.id] = p.name;
        return map;
      }, {});
      
      // Process complaints
      for (const complaint of complaints) {
        // By type
        categorization.by_type[complaint.complaint_type] = 
          (categorization.by_type[complaint.complaint_type] || 0) + 1;
        
        // By status
        categorization.by_status[complaint.status] = 
          (categorization.by_status[complaint.status] || 0) + 1;
        
        // By priority
        categorization.by_priority[complaint.priority] = 
          (categorization.by_priority[complaint.priority] || 0) + 1;
        
        // By product
        const productName = productMap[complaint.product_id] || 'Unknown';
        categorization.by_product[productName] = 
          (categorization.by_product[productName] || 0) + 1;
      }
      
      // Calculate sentiment analysis
      const sentimentAnalysis = {
        positive: complaints.filter(c => c.sentiment_score > 0.3).length,
        neutral: complaints.filter(c => c.sentiment_score >= -0.3 && c.sentiment_score <= 0.3).length,
        negative: complaints.filter(c => c.sentiment_score < -0.3).length,
        average_sentiment: complaints.reduce((sum, c) => sum + c.sentiment_score, 0) / complaints.length
      };
      
      // Get resolution metrics
      const resolutionMetrics = {
        resolved: complaints.filter(c => c.status === 'resolved').length,
        average_resolution_time: await this.calculateAverageResolutionTime(complaints),
        pending_critical: complaints.filter(c => c.status === 'open' && c.priority === 'critical').length
      };
      
      // Identify common themes using text analysis
      const commonThemes = await this.extractCommonThemes(complaints);
      
      return {
        summary: {
          total_complaints: complaints.length,
          new_this_period: complaints.filter(c => c.created_at >= startDate).length,
          resolution_rate: (resolutionMetrics.resolved / complaints.length) * 100,
          average_sentiment: sentimentAnalysis.average_sentiment
        },
        categorization,
        sentiment: sentimentAnalysis,
        resolution: resolutionMetrics,
        themes: commonThemes,
        recent_complaints: complaints.slice(0, 10).map(c => ({
          id: c.id,
          type: c.complaint_type,
          description: c.description.substring(0, 100) + '...',
          status: c.status,
          priority: c.priority,
          created_at: c.created_at,
          sentiment: c.sentiment_score
        })),
        actionable_insights: this.getComplaintInsights(categorization, sentimentAnalysis)
      };
    } catch (error) {
      logger.error('Error in complaints analysis:', error);
      throw error;
    }
  }

  // Get supply chain metrics
  async getSupplyChainMetrics(manufacturerId, startDate, endDate) {
    try {
      // Get supply chain events
      const events = await knex('supply_chain_events as sce')
        .join('nfc_tokens as nt', 'sce.token_id', 'nt.id')
        .where('nt.manufacturer_id', manufacturerId)
        .whereBetween('sce.timestamp', [startDate, endDate])
        .select('sce.*', 'nt.batch_number', 'nt.product_id');
      
      // Calculate key metrics
      const metrics = {
        total_products_tracked: await knex('nfc_tokens')
          .where('manufacturer_id', manufacturerId)
          .countDistinct('id as count')
          .first()
          .then(r => r.count),
        
        validation_rate: this.calculateValidationRate(events),
        
        average_time_to_market: await this.calculateTimeToMarket(manufacturerId, events),
        
        batch_performance: await this.analyzeBatchPerformance(manufacturerId, startDate, endDate),
        
        distribution_efficiency: await this.calculateDistributionEfficiency(events),
        
        authenticity_verification_rate: this.calculateAuthenticityRate(events)
      };
      
      // Get supply chain flow visualization data
      const flowData = await this.getSupplyChainFlow(events);
      
      // Identify bottlenecks and anomalies
      const anomalies = await this.detectSupplyChainAnomalies(events);
      
      return {
        metrics,
        flow: flowData,
        anomalies,
        recommendations: this.getSupplyChainRecommendations(metrics, anomalies)
      };
    } catch (error) {
      logger.error('Error in supply chain metrics:', error);
      throw error;
    }
  }

  // Get predictive insights using ML
  async getPredictiveInsights(manufacturerId) {
    try {
      // Get historical data for predictions
      const historicalData = await this.getHistoricalData(manufacturerId, 365);
      
      // Predict future trends
      const predictions = {
        counterfeit_risk: await this.predictCounterfeitRisk(historicalData),
        demand_forecast: await this.predictDemandForecast(historicalData),
        channel_risk_evolution: await this.predictChannelRiskEvolution(historicalData),
        seasonal_patterns: this.identifySeasonalPatterns(historicalData)
      };
      
      // Generate actionable recommendations
      const recommendations = this.generatePredictiveRecommendations(predictions);
      
      return {
        predictions,
        recommendations,
        confidence_levels: {
          counterfeit_risk: 0.85,
          demand_forecast: 0.78,
          channel_risk: 0.82
        }
      };
    } catch (error) {
      logger.error('Error generating predictive insights:', error);
      throw error;
    }
  }

  // Get active alerts and notifications
  async getActiveAlerts(manufacturerId) {
    try {
      const alerts = [];
      
      // Check for high-risk patterns
      const suspiciousPatterns = await knex('suspicious_patterns')
        .where('entity_type', 'manufacturer')
        .where('entity_id', manufacturerId)
        .where('is_confirmed', false)
        .where('risk_score', '>', 0.7)
        .orderBy('detected_at', 'desc')
        .limit(10);
      
      suspiciousPatterns.forEach(pattern => {
        alerts.push({
          id: pattern.id,
          type: 'suspicious_pattern',
          severity: pattern.risk_score > 0.9 ? 'critical' : 'high',
          title: `Suspicious ${pattern.pattern_type.replace(/_/g, ' ')} detected`,
          description: `Risk score: ${(pattern.risk_score * 100).toFixed(0)}%`,
          timestamp: pattern.detected_at,
          actions: ['investigate', 'dismiss', 'escalate']
        });
      });
      
      // Check for counterfeit spikes
      const recentCounterfeits = await knex('counterfeit_reports')
        .join('nfc_tokens', 'counterfeit_reports.token_id', 'nfc_tokens.id')
        .where('nfc_tokens.manufacturer_id', manufacturerId)
        .where('counterfeit_reports.created_at', '>', knex.raw("NOW() - INTERVAL '24 hours'"))
        .count('* as count')
        .first();
      
      if (recentCounterfeits.count > 10) {
        alerts.push({
          id: 'counterfeit_spike',
          type: 'counterfeit_alert',
          severity: 'critical',
          title: 'Unusual spike in counterfeit reports',
          description: `${recentCounterfeits.count} reports in the last 24 hours`,
          timestamp: new Date(),
          actions: ['view_reports', 'notify_team', 'initiate_investigation']
        });
      }
      
      // Check for channel issues
      const problematicChannels = await knex('distribution_channels')
        .where('trust_score', '<', 0.3)
        .where('counterfeit_rate', '>', 10)
        .limit(5);
      
      problematicChannels.forEach(channel => {
        alerts.push({
          id: `channel_${channel.id}`,
          type: 'channel_alert',
          severity: 'high',
          title: `High-risk channel: ${channel.channel_name}`,
          description: `Trust score: ${(channel.trust_score * 100).toFixed(0)}%, Counterfeit rate: ${channel.counterfeit_rate.toFixed(1)}%`,
          timestamp: new Date(),
          actions: ['view_channel', 'suspend_channel', 'contact_channel']
        });
      });
      
      // Sort by severity and timestamp
      alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.timestamp - a.timestamp;
      });
      
      return alerts;
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      throw error;
    }
  }

  // Get overview metrics
  async getOverviewMetrics(manufacturerId, startDate, endDate) {
    try {
      // Get key performance indicators
      const [
        totalProducts,
        totalValidations,
        totalCounterfeits,
        activeUsers,
        revenue
      ] = await Promise.all([
        knex('products').where('manufacturer_id', manufacturerId).count('* as count').first(),
        knex('supply_chain_events')
          .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
          .where('nfc_tokens.manufacturer_id', manufacturerId)
          .where('supply_chain_events.event_type', 'validation')
          .whereBetween('supply_chain_events.timestamp', [startDate, endDate])
          .count('* as count')
          .first(),
        knex('counterfeit_reports')
          .join('nfc_tokens', 'counterfeit_reports.token_id', 'nfc_tokens.id')
          .where('nfc_tokens.manufacturer_id', manufacturerId)
          .whereBetween('counterfeit_reports.created_at', [startDate, endDate])
          .count('* as count')
          .first(),
        knex('supply_chain_events')
          .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
          .where('nfc_tokens.manufacturer_id', manufacturerId)
          .whereBetween('supply_chain_events.timestamp', [startDate, endDate])
          .countDistinct('supply_chain_events.stakeholder_id as count')
          .first(),
        this.calculateEstimatedRevenue(manufacturerId, startDate, endDate)
      ]);
      
      // Calculate period-over-period changes
      const previousPeriod = this.getPreviousPeriod(startDate, endDate);
      const previousMetrics = await this.getOverviewMetrics(manufacturerId, previousPeriod.startDate, previousPeriod.endDate);
      
      return {
        products: {
          total: totalProducts.count,
          active: totalProducts.count // Simplified
        },
        validations: {
          total: totalValidations.count,
          change: this.calculatePercentageChange(totalValidations.count, previousMetrics.validations.total)
        },
        counterfeits: {
          total: totalCounterfeits.count,
          rate: (totalCounterfeits.count / Math.max(totalValidations.count, 1)) * 100,
          change: this.calculatePercentageChange(totalCounterfeits.count, previousMetrics.counterfeits.total)
        },
        users: {
          active: activeUsers.count,
          change: this.calculatePercentageChange(activeUsers.count, previousMetrics.users.active)
        },
        revenue: {
          estimated: revenue,
          protected: revenue * 0.97, // Assuming 3% loss prevention
          change: this.calculatePercentageChange(revenue, previousMetrics.revenue.estimated)
        }
      };
    } catch (error) {
      logger.error('Error calculating overview metrics:', error);
      // Return default metrics to avoid breaking the dashboard
      return {
        products: { total: 0, active: 0 },
        validations: { total: 0, change: 0 },
        counterfeits: { total: 0, rate: 0, change: 0 },
        users: { active: 0, change: 0 },
        revenue: { estimated: 0, protected: 0, change: 0 }
      };
    }
  }

  // Helper methods
  getDateRange(timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }

  calculateChannelPerformance(channel) {
    const weights = {
      trust_score: 0.4,
      validation_rate: 0.3,
      counterfeit_rate: 0.3
    };
    
    const validationRate = channel.validations / Math.max(channel.total_events, 1);
    const counterfeitPenalty = 1 - (channel.counterfeits / Math.max(channel.validations, 1));
    
    return (
      channel.trust_score * weights.trust_score +
      validationRate * weights.validation_rate +
      counterfeitPenalty * weights.counterfeit_rate
    );
  }

  async identifyRiskFactors(channel) {
    const riskFactors = [];
    
    if (channel.trust_score < 0.3) {
      riskFactors.push({
        factor: 'low_trust_score',
        severity: 'high',
        description: 'Trust score below acceptable threshold'
      });
    }
    
    if (channel.counterfeit_rate > 5) {
      riskFactors.push({
        factor: 'high_counterfeit_rate',
        severity: 'critical',
        description: `Counterfeit rate of ${channel.counterfeit_rate.toFixed(1)}% exceeds limit`
      });
    }
    
    if (channel.validations < 10) {
      riskFactors.push({
        factor: 'low_activity',
        severity: 'medium',
        description: 'Low validation activity may indicate issues'
      });
    }
    
    // Check for anomalies
    const anomalies = await knex('suspicious_patterns')
      .where('entity_id', channel.id)
      .where('entity_type', 'location')
      .where('risk_score', '>', 0.5)
      .count('* as count')
      .first();
    
    if (anomalies.count > 0) {
      riskFactors.push({
        factor: 'suspicious_patterns',
        severity: 'high',
        description: `${anomalies.count} suspicious patterns detected`
      });
    }
    
    return riskFactors;
  }

  getChannelRecommendations(channel) {
    const recommendations = [];
    
    if (channel.trust_score < 0.3) {
      recommendations.push({
        action: 'investigate',
        priority: 'high',
        description: 'Conduct immediate investigation of this channel'
      });
    }
    
    if (channel.counterfeit_rate > 5) {
      recommendations.push({
        action: 'suspend',
        priority: 'critical',
        description: 'Consider suspending shipments to this channel'
      });
    }
    
    if (channel.trust_score > 0.8 && channel.validations > 100) {
      recommendations.push({
        action: 'reward',
        priority: 'low',
        description: 'Consider partnership benefits for this trusted channel'
      });
    }
    
    return recommendations;
  }

  async getGeographicDistribution(channels) {
    // Group channels by country
    const byCountry = {};
    
    channels.forEach(channel => {
      const country = channel.country || 'Unknown';
      if (!byCountry[country]) {
        byCountry[country] = {
          channels: 0,
          validations: 0,
          counterfeits: 0,
          average_trust_score: 0
        };
      }
      
      byCountry[country].channels++;
      byCountry[country].validations += channel.validations || 0;
      byCountry[country].counterfeits += channel.counterfeits || 0;
      byCountry[country].average_trust_score += channel.trust_score;
    });
    
    // Calculate averages
    Object.keys(byCountry).forEach(country => {
      byCountry[country].average_trust_score /= byCountry[country].channels;
      byCountry[country].risk_level = 
        byCountry[country].average_trust_score < 0.5 ? 'high' :
        byCountry[country].average_trust_score < 0.7 ? 'medium' : 'low';
    });
    
    return byCountry;
  }

  async getChannelTrends(manufacturerId, startDate, endDate) {
    // Get daily channel performance
    const dailyData = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .where('nfc_tokens.manufacturer_id', manufacturerId)
      .whereBetween('supply_chain_events.timestamp', [startDate, endDate])
      .select(
        knex.raw('DATE(supply_chain_events.timestamp) as date'),
        knex.raw('COUNT(CASE WHEN event_type = \'validation\' THEN 1 END) as validations'),
        knex.raw('COUNT(CASE WHEN event_type = \'counterfeit_report\' THEN 1 END) as counterfeits')
      )
      .groupBy(knex.raw('DATE(supply_chain_events.timestamp)'))
      .orderBy('date');
    
    return {
      daily: dailyData,
      trend: this.calculateTrend(dailyData)
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.validations, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.validations, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  async calculateAverageResolutionTime(complaints) {
    const resolved = complaints.filter(c => c.status === 'resolved' && c.resolution_details);
    
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, complaint) => {
      const resolution = JSON.parse(complaint.resolution_details || '{}');
      if (resolution.resolved_at) {
        const resolvedDate = new Date(resolution.resolved_at);
        const createdDate = new Date(complaint.created_at);
        return sum + (resolvedDate - createdDate);
      }
      return sum;
    }, 0);
    
    return totalTime / resolved.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  async extractCommonThemes(complaints) {
    // Simple keyword extraction - in production, use NLP
    const keywords = {};
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an'];
    
    complaints.forEach(complaint => {
      const words = complaint.description.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));
      
      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });
    
    // Get top themes
    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({
        theme: keyword,
        frequency: count,
        percentage: (count / complaints.length) * 100
      }));
  }

  getComplaintInsights(categorization, sentiment) {
    const insights = [];
    
    // Check for quality issues
    if (categorization.by_type.quality > categorization.by_type.authenticity) {
      insights.push({
        type: 'quality_concern',
        message: 'Quality complaints exceed authenticity concerns',
        recommendation: 'Review quality control processes'
      });
    }
    
    // Check sentiment
    if (sentiment.average_sentiment < -0.3) {
      insights.push({
        type: 'negative_sentiment',
        message: 'Overall customer sentiment is negative',
        recommendation: 'Implement customer satisfaction improvement program'
      });
    }
    
    // Check resolution rate
    const totalComplaints = Object.values(categorization.by_status).reduce((a, b) => a + b, 0);
    const resolvedComplaints = categorization.by_status.resolved || 0;
    const resolutionRate = resolvedComplaints / totalComplaints;
    
    if (resolutionRate < 0.7) {
      insights.push({
        type: 'low_resolution',
        message: 'Resolution rate below 70%',
        recommendation: 'Improve complaint handling processes'
      });
    }
    
    return insights;
  }

  calculateValidationRate(events) {
    const validations = events.filter(e => e.event_type === 'validation').length;
    const total = events.filter(e => e.event_type === 'production').length;
    
    return total > 0 ? (validations / total) * 100 : 0;
  }

  async calculateTimeToMarket(manufacturerId, events) {
    // Calculate average time from production to first validation
    const productionEvents = events.filter(e => e.event_type === 'production');
    const validationEvents = events.filter(e => e.event_type === 'validation');
    
    let totalTime = 0;
    let count = 0;
    
    productionEvents.forEach(prod => {
      const firstValidation = validationEvents.find(val => val.token_id === prod.token_id);
      if (firstValidation) {
        const timeDiff = new Date(firstValidation.timestamp) - new Date(prod.timestamp);
        totalTime += timeDiff;
        count++;
      }
    });
    
    return count > 0 ? totalTime / count / (1000 * 60 * 60 * 24) : 0; // Days
  }

  async analyzeBatchPerformance(manufacturerId, startDate, endDate) {
    const batchData = await knex('nfc_tokens')
      .where('manufacturer_id', manufacturerId)
      .whereBetween('created_at', [startDate, endDate])
      .select('batch_number')
      .select(knex.raw('COUNT(*) as total_tokens'))
      .select(knex.raw('COUNT(CASE WHEN status = \'validated\' THEN 1 END) as validated'))
      .select(knex.raw('COUNT(CASE WHEN status = \'reported\' THEN 1 END) as reported'))
      .groupBy('batch_number')
      .orderBy('batch_number', 'desc')
      .limit(20);
    
    return batchData.map(batch => ({
      ...batch,
      validation_rate: (batch.validated / batch.total_tokens) * 100,
      counterfeit_rate: (batch.reported / batch.total_tokens) * 100,
      performance_score: batch.validated / (batch.validated + batch.reported * 10) // Penalize counterfeits
    }));
  }

  async calculateDistributionEfficiency(events) {
    // Calculate metrics for distribution efficiency
    const distributionEvents = events.filter(e => e.event_type === 'distribution');
    const validationEvents = events.filter(e => e.event_type === 'validation');
    
    return {
      coverage: (validationEvents.length / Math.max(distributionEvents.length, 1)) * 100,
      speed: await this.calculateAverageDistributionTime(events),
      bottlenecks: await this.identifyDistributionBottlenecks(events)
    };
  }

  calculateAuthenticityRate(events) {
    const validations = events.filter(e => e.event_type === 'validation').length;
    const counterfeits = events.filter(e => e.event_type === 'counterfeit_report').length;
    
    return validations > 0 ? ((validations - counterfeits) / validations) * 100 : 100;
  }

  async getSupplyChainFlow(events) {
    // Create flow visualization data
    const nodes = new Set();
    const links = [];
    
    events.forEach(event => {
      nodes.add(event.stakeholder_type);
      
      if (event.metadata) {
        const meta = JSON.parse(event.metadata);
        if (meta.from && meta.to) {
          links.push({
            source: meta.from,
            target: meta.to,
            value: 1
          });
        }
      }
    });
    
    return {
      nodes: Array.from(nodes).map(n => ({ id: n, name: n })),
      links: links
    };
  }

  async detectSupplyChainAnomalies(events) {
    const anomalies = [];
    
    // Check for validation velocity anomalies
    const validationsByHour = {};
    events.filter(e => e.event_type === 'validation').forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      validationsByHour[hour] = (validationsByHour[hour] || 0) + 1;
    });
    
    const avgValidations = Object.values(validationsByHour).reduce((a, b) => a + b, 0) / 24;
    
    Object.entries(validationsByHour).forEach(([hour, count]) => {
      if (count > avgValidations * 3) {
        anomalies.push({
          type: 'validation_spike',
          severity: 'medium',
          description: `Unusual validation spike at ${hour}:00 (${count} validations)`,
          recommendation: 'Investigate potential bulk scanning'
        });
      }
    });
    
    // Check for geographic anomalies
    // Simplified - in production, use more sophisticated analysis
    
    return anomalies;
  }

  getSupplyChainRecommendations(metrics, anomalies) {
    const recommendations = [];
    
    if (metrics.validation_rate < 70) {
      recommendations.push({
        priority: 'high',
        action: 'Improve product tracking adoption',
        impact: 'Increase visibility and reduce counterfeit risk'
      });
    }
    
    if (metrics.average_time_to_market > 30) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize distribution channels',
        impact: 'Reduce time to market and improve freshness'
      });
    }
    
    if (anomalies.length > 5) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate supply chain anomalies',
        impact: 'Identify and address potential security issues'
      });
    }
    
    return recommendations;
  }

  async getHistoricalData(manufacturerId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await knex('analytics_daily')
      .where('manufacturer_id', manufacturerId)
      .where('date', '>=', startDate)
      .orderBy('date');
  }

  async predictCounterfeitRisk(historicalData) {
    // Simplified prediction - in production, use ML model
    const recentTrend = historicalData.slice(-30);
    const avgCounterfeits = recentTrend.reduce((sum, d) => sum + d.counterfeit_reports, 0) / recentTrend.length;
    
    const trend = this.calculateTrend(recentTrend.map(d => ({
      validations: d.total_validations,
      counterfeits: d.counterfeit_reports
    })));
    
    return {
      current_risk: avgCounterfeits > 5 ? 'high' : avgCounterfeits > 2 ? 'medium' : 'low',
      trend: trend,
      forecast_30_days: avgCounterfeits * 30,
      confidence: 0.75
    };
  }

  async predictDemandForecast(historicalData) {
    // Simplified forecast - in production, use time series analysis
    const recentData = historicalData.slice(-90);
    const avgDaily = recentData.reduce((sum, d) => sum + d.total_validations, 0) / recentData.length;
    
    // Identify seasonal patterns
    const monthlyAvg = {};
    recentData.forEach(d => {
      const month = new Date(d.date).getMonth();
      if (!monthlyAvg[month]) monthlyAvg[month] = [];
      monthlyAvg[month].push(d.total_validations);
    });
    
    return {
      next_30_days: Math.round(avgDaily * 30),
      peak_season: Object.entries(monthlyAvg)
        .map(([month, values]) => ({
          month: parseInt(month),
          average: values.reduce((a, b) => a + b, 0) / values.length
        }))
        .sort((a, b) => b.average - a.average)[0],
      growth_rate: this.calculateGrowthRate(recentData)
    };
  }

  async predictChannelRiskEvolution(historicalData) {
    // Analyze channel risk trends
    const channelMetrics = JSON.parse(historicalData[historicalData.length - 1]?.channel_performance || '{}');
    
    return {
      high_risk_channels: Object.entries(channelMetrics)
        .filter(([, metrics]) => metrics.trust_score < 0.3)
        .length,
      improving_channels: Object.entries(channelMetrics)
        .filter(([, metrics]) => metrics.trend === 'improving')
        .length,
      deteriorating_channels: Object.entries(channelMetrics)
        .filter(([, metrics]) => metrics.trend === 'deteriorating')
        .length
    };
  }

  identifySeasonalPatterns(historicalData) {
    const monthlyData = {};
    
    historicalData.forEach(d => {
      const month = new Date(d.date).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = {
          validations: 0,
          counterfeits: 0,
          count: 0
        };
      }
      
      monthlyData[month].validations += d.total_validations;
      monthlyData[month].counterfeits += d.counterfeit_reports;
      monthlyData[month].count++;
    });
    
    // Calculate averages and identify patterns
    const patterns = Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      avg_validations: data.validations / data.count,
      avg_counterfeits: data.counterfeits / data.count,
      risk_level: (data.counterfeits / data.validations) * 100
    }));
    
    return {
      peak_months: patterns.sort((a, b) => b.avg_validations - a.avg_validations).slice(0, 3),
      high_risk_months: patterns.sort((a, b) => b.risk_level - a.risk_level).slice(0, 3)
    };
  }

  generatePredictiveRecommendations(predictions) {
    const recommendations = [];
    
    if (predictions.counterfeit_risk.current_risk === 'high') {
      recommendations.push({
        priority: 'critical',
        action: 'Implement enhanced authentication measures',
        timeline: 'immediate',
        expected_impact: 'Reduce counterfeit rate by 40%'
      });
    }
    
    if (predictions.demand_forecast.growth_rate > 20) {
      recommendations.push({
        priority: 'high',
        action: 'Scale production capacity',
        timeline: '30 days',
        expected_impact: 'Meet growing demand without stockouts'
      });
    }
    
    if (predictions.channel_risk_evolution.deteriorating_channels > 3) {
      recommendations.push({
        priority: 'high',
        action: 'Review and restructure channel partnerships',
        timeline: '60 days',
        expected_impact: 'Improve overall channel trust score by 25%'
      });
    }
    
    return recommendations;
  }

  async calculateEstimatedRevenue(manufacturerId, startDate, endDate) {
    // Simplified revenue calculation based on validations
    const validations = await knex('supply_chain_events')
      .join('nfc_tokens', 'supply_chain_events.token_id', 'nfc_tokens.id')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .where('nfc_tokens.manufacturer_id', manufacturerId)
      .where('supply_chain_events.event_type', 'validation')
      .whereBetween('supply_chain_events.timestamp', [startDate, endDate])
      .count('* as count')
      .first();
    
    // Assume average product value of $50
    return validations.count * 50;
  }

  getPreviousPeriod(startDate, endDate) {
    const duration = endDate - startDate;
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    
    return { startDate: previousStart, endDate: previousEnd };
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  calculateGrowthRate(data) {
    if (data.length < 2) return 0;
    
    const firstValue = data[0].total_validations;
    const lastValue = data[data.length - 1].total_validations;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  async calculateAverageDistributionTime(events) {
    // Calculate average time between distribution and validation events
    return 5; // Simplified - return 5 days
  }

  async identifyDistributionBottlenecks(events) {
    // Identify bottlenecks in distribution
    return []; // Simplified
  }
}

module.exports = new ManufacturerAnalyticsController();