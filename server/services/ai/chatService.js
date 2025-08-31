const { Configuration, OpenAIApi } = require('openai');
const knex = require('../../config/database');
const logger = require('../../utils/logger');
const anomalyDetection = require('../ml/anomalyDetection');

class AIChhatService {
  constructor() {
    // Initialize with OpenAI API (can be replaced with local LLM)
    this.configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY || 'demo-key'
    });
    this.openai = new OpenAIApi(this.configuration);
    this.systemPrompt = this.getSystemPrompt();
  }

  getSystemPrompt() {
    return `You are an AI assistant for the Vanguard Anti-Counterfeiting System. Your role is to help users:
    1. Identify patterns in counterfeit activities
    2. Track repeat offenders and suspicious channels
    3. Analyze supply chain data for anomalies
    4. Provide actionable insights for manufacturers and law enforcement
    5. Guide users through the investigation process

    You have access to real-time data about:
    - Product validations and counterfeit reports
    - User behavior patterns and anomalies
    - Distribution channel performance
    - Geographic trends and hotspots
    - Historical patterns and predictions

    Always provide data-driven insights and specific recommendations.`;
  }

  async startSession(userId, sessionType = 'support') {
    try {
      const sessionId = require('uuid').v4();
      
      await knex('ai_chat_sessions').insert({
        id: sessionId,
        user_id: userId,
        session_type: sessionType,
        conversation_history: JSON.stringify([]),
        extracted_insights: JSON.stringify([]),
        action_items: JSON.stringify([]),
        is_active: true
      });

      return {
        sessionId,
        message: this.getWelcomeMessage(sessionType)
      };
    } catch (error) {
      logger.error('Error starting chat session:', error);
      throw error;
    }
  }

  getWelcomeMessage(sessionType) {
    const messages = {
      support: "Hello! I'm your AI assistant for the Vanguard Anti-Counterfeiting System. How can I help you today?",
      analytics: "Welcome to the Analytics Assistant. I can help you analyze patterns, identify trends, and uncover insights in your anti-counterfeiting data.",
      investigation: "Investigation mode activated. I'll help you track down counterfeit sources and identify suspicious patterns. What would you like to investigate?"
    };
    return messages[sessionType] || messages.support;
  }

  async processMessage(sessionId, message) {
    try {
      // Get session
      const session = await knex('ai_chat_sessions')
        .where({ id: sessionId, is_active: true })
        .first();

      if (!session) {
        throw new Error('Session not found or inactive');
      }

      const conversationHistory = JSON.parse(session.conversation_history || '[]');
      conversationHistory.push({ role: 'user', content: message });

      // Analyze intent and extract entities
      const analysis = await this.analyzeMessage(message);
      
      // Fetch relevant data based on intent
      const contextData = await this.fetchContextData(analysis);
      
      // Generate response
      const response = await this.generateResponse(conversationHistory, contextData, analysis);
      
      // Extract actionable insights
      const insights = this.extractInsights(response, analysis, contextData);
      
      // Update conversation history
      conversationHistory.push({ role: 'assistant', content: response });
      
      // Update session
      await knex('ai_chat_sessions')
        .where('id', sessionId)
        .update({
          conversation_history: JSON.stringify(conversationHistory),
          extracted_insights: JSON.stringify([
            ...JSON.parse(session.extracted_insights || '[]'),
            ...insights
          ]),
          updated_at: new Date()
        });

      return {
        response,
        insights,
        suggestedActions: this.generateSuggestedActions(analysis, contextData)
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  async analyzeMessage(message) {
    // Simple intent detection (can be enhanced with NLP)
    const intents = {
      track_offender: /track|repeat offender|suspicious user|multiple reports/i,
      analyze_channel: /channel|distributor|retailer|store|location/i,
      investigate_pattern: /pattern|trend|anomaly|unusual|spike/i,
      counterfeit_hotspot: /hotspot|area|region|geographic|where/i,
      product_analysis: /product|brand|category|which products/i,
      time_analysis: /when|time|hour|day|month|season/i,
      prediction: /predict|forecast|future|will|expect/i
    };

    const detectedIntents = [];
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        detectedIntents.push(intent);
      }
    }

    // Extract entities (simplified - can use NER)
    const entities = {
      timeframe: this.extractTimeframe(message),
      location: this.extractLocation(message),
      productId: this.extractProductId(message),
      userId: this.extractUserId(message)
    };

    return { intents: detectedIntents, entities };
  }

  async fetchContextData(analysis) {
    const data = {};

    try {
      // Fetch data based on detected intents
      if (analysis.intents.includes('track_offender')) {
        data.repeatOffenders = await this.getRepeatOffenders(analysis.entities.timeframe);
      }

      if (analysis.intents.includes('analyze_channel')) {
        data.channelAnalysis = await this.getChannelAnalysis(analysis.entities.location);
      }

      if (analysis.intents.includes('investigate_pattern')) {
        data.patterns = await this.getAnomalousPatterns(analysis.entities.timeframe);
      }

      if (analysis.intents.includes('counterfeit_hotspot')) {
        data.hotspots = await this.getCounterfeitHotspots();
      }

      if (analysis.intents.includes('product_analysis')) {
        data.productStats = await this.getProductAnalysis(analysis.entities.productId);
      }

      if (analysis.intents.includes('time_analysis')) {
        data.timePatterns = await this.getTimePatterns();
      }

      if (analysis.intents.includes('prediction')) {
        data.predictions = await this.getPredictions();
      }

      return data;
    } catch (error) {
      logger.error('Error fetching context data:', error);
      return data;
    }
  }

  async getRepeatOffenders(timeframe = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    return await knex('counterfeit_reports')
      .select('reporter_id')
      .select(knex.raw('COUNT(*) as report_count'))
      .select(knex.raw('array_agg(DISTINCT token_id) as reported_tokens'))
      .where('created_at', '>=', startDate)
      .groupBy('reporter_id')
      .having(knex.raw('COUNT(*) > 2'))
      .orderBy('report_count', 'desc')
      .limit(10);
  }

  async getChannelAnalysis(location) {
    const query = knex('distribution_channels')
      .select('*')
      .orderBy('counterfeit_rate', 'desc')
      .limit(20);

    if (location) {
      query.where('country', location)
        .orWhere('address', 'ilike', `%${location}%`);
    }

    return await query;
  }

  async getAnomalousPatterns(timeframe = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    return await knex('suspicious_patterns')
      .where('detected_at', '>=', startDate)
      .where('risk_score', '>', 0.7)
      .orderBy('risk_score', 'desc')
      .limit(20);
  }

  async getCounterfeitHotspots() {
    return await knex('counterfeit_reports')
      .select(knex.raw('ST_Y(location::geometry) as latitude'))
      .select(knex.raw('ST_X(location::geometry) as longitude'))
      .select(knex.raw('COUNT(*) as report_count'))
      .whereNotNull('location')
      .groupBy(knex.raw('ST_SnapToGrid(location::geometry, 0.01)'))
      .having(knex.raw('COUNT(*) > 3'))
      .orderBy('report_count', 'desc')
      .limit(50);
  }

  async getProductAnalysis(productId) {
    const query = knex('nfc_tokens')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .select('products.name', 'products.category')
      .select(knex.raw('COUNT(CASE WHEN nfc_tokens.status = \'reported\' THEN 1 END) as counterfeit_count'))
      .select(knex.raw('COUNT(CASE WHEN nfc_tokens.status = \'validated\' THEN 1 END) as validated_count'))
      .groupBy('products.id', 'products.name', 'products.category');

    if (productId) {
      query.where('products.id', productId);
    }

    return await query.orderBy('counterfeit_count', 'desc').limit(20);
  }

  async getTimePatterns() {
    return await knex('supply_chain_events')
      .select(knex.raw('EXTRACT(HOUR FROM timestamp) as hour'))
      .select(knex.raw('EXTRACT(DOW FROM timestamp) as day_of_week'))
      .select(knex.raw('COUNT(*) as event_count'))
      .where('event_type', 'counterfeit_report')
      .groupBy(knex.raw('EXTRACT(HOUR FROM timestamp), EXTRACT(DOW FROM timestamp)'))
      .orderBy('event_count', 'desc');
  }

  async getPredictions() {
    // Use ML model for predictions
    const recentPatterns = await knex('suspicious_patterns')
      .where('detected_at', '>=', knex.raw('NOW() - INTERVAL \'7 days\''))
      .select('pattern_data');

    // Simplified prediction logic
    const riskAreas = {};
    recentPatterns.forEach(pattern => {
      const data = JSON.parse(pattern.pattern_data || '{}');
      if (data.location) {
        riskAreas[data.location] = (riskAreas[data.location] || 0) + 1;
      }
    });

    return {
      highRiskAreas: Object.entries(riskAreas)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, riskLevel: count })),
      predictedTrend: 'increasing', // Simplified
      confidenceLevel: 0.75
    };
  }

  async generateResponse(conversationHistory, contextData, analysis) {
    try {
      // For demo purposes, generate response based on context
      // In production, this would use the actual LLM API
      
      let response = '';

      if (analysis.intents.includes('track_offender') && contextData.repeatOffenders) {
        const offenders = contextData.repeatOffenders;
        response = `I've identified ${offenders.length} repeat offenders in the system:\n\n`;
        offenders.forEach((offender, index) => {
          response += `${index + 1}. User ID: ${offender.reporter_id} - ${offender.report_count} reports\n`;
        });
        response += '\nThese users have made multiple counterfeit reports. I recommend investigating their patterns and potentially flagging them for review.';
      }

      if (analysis.intents.includes('analyze_channel') && contextData.channelAnalysis) {
        const channels = contextData.channelAnalysis;
        response = `Channel analysis reveals the following high-risk distribution points:\n\n`;
        channels.slice(0, 5).forEach((channel, index) => {
          response += `${index + 1}. ${channel.channel_name} (${channel.channel_type})\n`;
          response += `   - Trust Score: ${(channel.trust_score * 100).toFixed(1)}%\n`;
          response += `   - Counterfeit Rate: ${channel.counterfeit_rate.toFixed(1)}%\n`;
          response += `   - Location: ${channel.address || 'Unknown'}\n\n`;
        });
      }

      if (analysis.intents.includes('counterfeit_hotspot') && contextData.hotspots) {
        const hotspots = contextData.hotspots;
        response = `I've identified ${hotspots.length} counterfeit hotspots:\n\n`;
        hotspots.slice(0, 5).forEach((hotspot, index) => {
          response += `${index + 1}. Location: ${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}\n`;
          response += `   - Reports: ${hotspot.report_count}\n`;
        });
        response += '\nThese areas show concentrated counterfeit activity and should be prioritized for investigation.';
      }

      if (!response) {
        response = 'I understand you want to analyze anti-counterfeiting data. Could you please be more specific about what you\'d like to investigate? For example:\n';
        response += '- "Show me repeat offenders in the last month"\n';
        response += '- "Analyze high-risk channels in New York"\n';
        response += '- "Find counterfeit hotspots"\n';
        response += '- "Predict future risk areas"';
      }

      return response;
    } catch (error) {
      logger.error('Error generating response:', error);
      return 'I encountered an error while analyzing the data. Please try rephrasing your question.';
    }
  }

  extractInsights(response, analysis, contextData) {
    const insights = [];

    if (contextData.repeatOffenders && contextData.repeatOffenders.length > 0) {
      insights.push({
        type: 'repeat_offenders',
        severity: 'high',
        description: `${contextData.repeatOffenders.length} users have made multiple counterfeit reports`,
        action: 'investigate_users'
      });
    }

    if (contextData.channelAnalysis) {
      const highRiskChannels = contextData.channelAnalysis.filter(c => c.trust_score < 0.3);
      if (highRiskChannels.length > 0) {
        insights.push({
          type: 'high_risk_channels',
          severity: 'critical',
          description: `${highRiskChannels.length} distribution channels show high counterfeit rates`,
          action: 'audit_channels'
        });
      }
    }

    if (contextData.hotspots && contextData.hotspots.length > 5) {
      insights.push({
        type: 'geographic_concentration',
        severity: 'high',
        description: 'Counterfeit activity is geographically concentrated',
        action: 'deploy_investigation_teams'
      });
    }

    return insights;
  }

  generateSuggestedActions(analysis, contextData) {
    const actions = [];

    if (analysis.intents.includes('track_offender')) {
      actions.push({
        action: 'View Detailed User Reports',
        link: '/reports/users',
        description: 'See comprehensive user behavior analysis'
      });
    }

    if (analysis.intents.includes('analyze_channel')) {
      actions.push({
        action: 'Channel Risk Assessment',
        link: '/channels/assessment',
        description: 'Run full risk assessment on distribution channels'
      });
    }

    if (analysis.intents.includes('counterfeit_hotspot')) {
      actions.push({
        action: 'View Heat Map',
        link: '/analytics/heatmap',
        description: 'Visualize counterfeit activity on interactive map'
      });
    }

    actions.push({
      action: 'Generate Report',
      link: '/reports/generate',
      description: 'Create detailed report of findings'
    });

    return actions;
  }

  // Helper methods for entity extraction
  extractTimeframe(message) {
    const patterns = {
      'last week': 7,
      'last month': 30,
      'last year': 365,
      'yesterday': 1,
      'today': 0
    };

    for (const [pattern, days] of Object.entries(patterns)) {
      if (message.toLowerCase().includes(pattern)) {
        return days;
      }
    }

    // Extract numeric timeframes
    const match = message.match(/(\d+)\s*(day|week|month|year)s?/i);
    if (match) {
      const multipliers = { day: 1, week: 7, month: 30, year: 365 };
      return parseInt(match[1]) * multipliers[match[2].toLowerCase()];
    }

    return 30; // Default to 30 days
  }

  extractLocation(message) {
    // Simple location extraction - in production, use NER
    const locations = ['new york', 'london', 'paris', 'tokyo', 'mumbai', 'sydney'];
    for (const location of locations) {
      if (message.toLowerCase().includes(location)) {
        return location;
      }
    }
    return null;
  }

  extractProductId(message) {
    // Extract UUID pattern
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = message.match(uuidPattern);
    return match ? match[0] : null;
  }

  extractUserId(message) {
    // Similar to product ID extraction
    return this.extractProductId(message);
  }

  async endSession(sessionId) {
    try {
      const session = await knex('ai_chat_sessions')
        .where({ id: sessionId })
        .first();

      if (!session) {
        throw new Error('Session not found');
      }

      // Generate session summary
      const summary = await this.generateSessionSummary(session);

      await knex('ai_chat_sessions')
        .where('id', sessionId)
        .update({
          is_active: false,
          action_items: JSON.stringify(summary.actionItems),
          updated_at: new Date()
        });

      return summary;
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  async generateSessionSummary(session) {
    const insights = JSON.parse(session.extracted_insights || '[]');
    const conversation = JSON.parse(session.conversation_history || '[]');

    return {
      totalMessages: conversation.length,
      keyInsights: insights,
      actionItems: insights.map(i => ({
        priority: i.severity,
        action: i.action,
        description: i.description
      })),
      sessionDuration: new Date() - new Date(session.created_at)
    };
  }
}

module.exports = new AIChhatService();