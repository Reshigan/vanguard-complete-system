const natural = require('natural');
const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AIChatService {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.tokenizer = new natural.WordTokenizer();
    this.initializeClassifier();
  }

  initializeClassifier() {
    // Train classifier with intents
    // Verification intents
    this.classifier.addDocument('verify product check authentic real genuine', 'verify');
    this.classifier.addDocument('is this real fake counterfeit authentic', 'verify');
    this.classifier.addDocument('check if product is genuine original', 'verify');
    
    // Report intents
    this.classifier.addDocument('report fake counterfeit suspicious product', 'report');
    this.classifier.addDocument('found fake want to report counterfeit', 'report');
    this.classifier.addDocument('suspicious product report fraud', 'report');
    
    // Track intents
    this.classifier.addDocument('track product history supply chain', 'track');
    this.classifier.addDocument('where product from origin history', 'track');
    this.classifier.addDocument('product journey supply chain track', 'track');
    
    // Reward intents
    this.classifier.addDocument('rewards points balance redeem', 'rewards');
    this.classifier.addDocument('how many points do i have reward', 'rewards');
    this.classifier.addDocument('redeem points gifts rewards catalog', 'rewards');
    
    // Help intents
    this.classifier.addDocument('help how to use guide tutorial', 'help');
    this.classifier.addDocument('what can you do help me', 'help');
    this.classifier.addDocument('instructions guide how does this work', 'help');

    this.classifier.train();
  }

  async processMessage(userId, message, sessionId = null) {
    try {
      // Get or create session
      let session;
      if (sessionId) {
        session = await knex('ai_chat_sessions').where('id', sessionId).first();
      }
      
      if (!session) {
        session = await this.createSession(userId);
        sessionId = session.id;
      }

      // Detect intent
      const intent = this.classifier.classify(message.toLowerCase());
      
      // Extract entities
      const entities = await this.extractEntities(message);
      
      // Generate response based on intent
      const response = await this.generateResponse(intent, entities, userId, message);
      
      // Update session
      await this.updateSession(sessionId, message, response.text, intent, entities);
      
      return {
        sessionId,
        intent,
        entities,
        response: response.text,
        actions: response.actions,
        relatedData: response.relatedData
      };
    } catch (error) {
      console.error('Error processing chat message:', error);
      return {
        sessionId,
        response: "I'm sorry, I encountered an error. Please try again.",
        error: true
      };
    }
  }

  async createSession(userId) {
    const session = {
      id: uuidv4(),
      user_id: userId,
      messages: JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await knex('ai_chat_sessions').insert(session);
    return session;
  }

  async updateSession(sessionId, userMessage, botResponse, intent, entities) {
    const session = await knex('ai_chat_sessions').where('id', sessionId).first();
    const messages = JSON.parse(session.messages || '[]');
    
    messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });
    
    messages.push({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date()
    });
    
    await knex('ai_chat_sessions')
      .where('id', sessionId)
      .update({
        messages: JSON.stringify(messages),
        intent,
        entities: JSON.stringify(entities),
        updated_at: new Date()
      });
  }

  async extractEntities(message) {
    const entities = {
      tokenIds: [],
      productNames: [],
      locations: [],
      dates: []
    };
    
    // Extract token IDs (simplified - looks for hex patterns)
    const tokenPattern = /\b[0-9a-f]{8,}\b/gi;
    const tokenMatches = message.match(tokenPattern);
    if (tokenMatches) {
      entities.tokenIds = tokenMatches;
    }
    
    // Extract South African locations
    const locations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Soweto', 
                      'Port Elizabeth', 'Bloemfontein', 'East London'];
    locations.forEach(location => {
      if (message.toLowerCase().includes(location.toLowerCase())) {
        entities.locations.push(location);
      }
    });
    
    // Extract dates (simplified)
    const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g;
    const dateMatches = message.match(datePattern);
    if (dateMatches) {
      entities.dates = dateMatches;
    }
    
    return entities;
  }

  async generateResponse(intent, entities, userId, originalMessage) {
    let response = { text: '', actions: [], relatedData: {} };
    
    switch (intent) {
      case 'verify':
        response = await this.handleVerifyIntent(entities, userId);
        break;
        
      case 'report':
        response = await this.handleReportIntent(entities, userId);
        break;
        
      case 'track':
        response = await this.handleTrackIntent(entities, userId);
        break;
        
      case 'rewards':
        response = await this.handleRewardsIntent(userId);
        break;
        
      case 'help':
        response = this.handleHelpIntent();
        break;
        
      default:
        response = await this.handleGeneralQuery(originalMessage, userId);
    }
    
    return response;
  }

  async handleVerifyIntent(entities, userId) {
    if (entities.tokenIds.length > 0) {
      const tokenId = entities.tokenIds[0];
      
      // Check if token exists
      const token = await knex('nfc_tokens')
        .where('token_hash', tokenId)
        .orWhere('id', tokenId)
        .first();
      
      if (token) {
        const product = await knex('products').where('id', token.product_id).first();
        const manufacturer = await knex('manufacturers').where('id', token.manufacturer_id).first();
        
        // Check ML fraud detection
        const mlService = require('./mlService');
        const fraudCheck = await mlService.predictFraud(token.id, { userId });
        
        if (fraudCheck.isCounterfeit) {
          return {
            text: `⚠️ WARNING: This product shows signs of being counterfeit!\n\n` +
                  `Confidence: ${(fraudCheck.confidence * 100).toFixed(1)}%\n` +
                  `Product: ${product.name}\n` +
                  `Please report this immediately for a reward.`,
            actions: [
              { type: 'report', label: 'Report Counterfeit', data: { tokenId: token.id } }
            ],
            relatedData: { token, product, manufacturer, fraudCheck }
          };
        } else {
          return {
            text: `✅ Product Verified!\n\n` +
                  `Product: ${product.name}\n` +
                  `Manufacturer: ${manufacturer.name}\n` +
                  `Batch: ${token.batch_number}\n` +
                  `Status: ${token.status}\n` +
                  `Authenticity Score: ${((1 - fraudCheck.confidence) * 100).toFixed(1)}%`,
            actions: [
              { type: 'track', label: 'View History', data: { tokenId: token.id } }
            ],
            relatedData: { token, product, manufacturer }
          };
        }
      } else {
        return {
          text: `❌ Token not found. This could indicate a counterfeit product. ` +
                `Please double-check the code or report this suspicious item.`,
          actions: [
            { type: 'report', label: 'Report Suspicious Product' }
          ]
        };
      }
    } else {
      return {
        text: `To verify a product, please provide the authentication code found on the product. ` +
              `You can scan the NFC tag or enter the code manually.`,
        actions: [
          { type: 'scan', label: 'Scan NFC Tag' },
          { type: 'manual', label: 'Enter Code Manually' }
        ]
      };
    }
  }

  async handleReportIntent(entities, userId) {
    if (entities.tokenIds.length > 0) {
      const reportId = uuidv4();
      
      return {
        text: `Thank you for reporting a suspicious product! 🎯\n\n` +
              `Report ID: ${reportId}\n` +
              `Status: Under Investigation\n\n` +
              `If confirmed, you'll receive up to R500 in rewards. ` +
              `Please provide additional details or photos if available.`,
        actions: [
          { type: 'upload', label: 'Add Photos', data: { reportId } },
          { type: 'details', label: 'Add Details', data: { reportId } }
        ],
        relatedData: { reportId, tokenId: entities.tokenIds[0] }
      };
    } else {
      return {
        text: `To report a counterfeit product, I'll need:\n` +
              `1. The product code or scan the item\n` +
              `2. Your location\n` +
              `3. Photos of the suspicious product\n` +
              `4. Where you found/purchased it\n\n` +
              `You can earn rewards for confirmed reports!`,
        actions: [
          { type: 'scan', label: 'Scan Product' },
          { type: 'manual', label: 'Enter Details Manually' }
        ]
      };
    }
  }

  async handleTrackIntent(entities, userId) {
    if (entities.tokenIds.length > 0) {
      const tokenId = entities.tokenIds[0];
      
      const events = await knex('supply_chain_events')
        .where('token_id', tokenId)
        .orderBy('timestamp', 'asc')
        .limit(10);
      
      if (events.length > 0) {
        let timeline = 'Product Journey:\n\n';
        
        for (const event of events) {
          const date = new Date(event.timestamp).toLocaleDateString('en-ZA');
          timeline += `📍 ${date}: ${event.event_type.replace('_', ' ').toUpperCase()}\n`;
        }
        
        return {
          text: timeline + '\nThis product has been tracked through our secure supply chain.',
          actions: [
            { type: 'details', label: 'View Full Details', data: { tokenId } }
          ],
          relatedData: { events }
        };
      }
    }
    
    return {
      text: `To track a product's journey, please provide the product code. ` +
            `I can show you its complete supply chain history from manufacture to retail.`,
      actions: [
        { type: 'scan', label: 'Scan Product' }
      ]
    };
  }

  async handleRewardsIntent(userId) {
    const user = await knex('users').where('id', userId).first();
    
    if (user) {
      const recentTransactions = await knex('rewards_transactions')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(5);
      
      const availableRewards = await knex('rewards_catalog')
        .where('is_active', true)
        .where('points_required', '<=', user.rewards_balance)
        .orderBy('points_required', 'asc')
        .limit(3);
      
      let response = `💰 Your Rewards Balance: R${user.rewards_balance}\n\n`;
      
      if (availableRewards.length > 0) {
        response += 'Available Rewards:\n';
        availableRewards.forEach(reward => {
          response += `• ${reward.name} - ${reward.points_required} points\n`;
        });
      }
      
      return {
        text: response,
        actions: [
          { type: 'catalog', label: 'View All Rewards' },
          { type: 'history', label: 'Transaction History' }
        ],
        relatedData: { balance: user.rewards_balance, availableRewards }
      };
    }
    
    return {
      text: 'Please log in to view your rewards balance and available redemptions.',
      actions: [
        { type: 'login', label: 'Log In' }
      ]
    };
  }

  handleHelpIntent() {
    return {
      text: `I'm your AuthentiGuard AI assistant! I can help you:\n\n` +
            `🔍 **Verify Products**: Check if products are genuine\n` +
            `🚨 **Report Counterfeits**: Report suspicious items and earn rewards\n` +
            `📍 **Track Products**: View supply chain history\n` +
            `💰 **Manage Rewards**: Check balance and redeem points\n` +
            `📊 **Get Insights**: Learn about counterfeit trends in your area\n\n` +
            `Just tell me what you'd like to do!`,
      actions: [
        { type: 'verify', label: 'Verify Product' },
        { type: 'report', label: 'Report Counterfeit' },
        { type: 'rewards', label: 'Check Rewards' }
      ]
    };
  }

  async handleGeneralQuery(message, userId) {
    // Check for counterfeit statistics query
    if (message.toLowerCase().includes('statistic') || message.toLowerCase().includes('how many')) {
      const stats = await knex('counterfeit_reports')
        .count('* as total')
        .where('created_at', '>=', knex.raw("DATE_SUB(NOW(), INTERVAL 30 DAY)"));
      
      const confirmed = await knex('counterfeit_reports')
        .count('* as total')
        .where('status', 'confirmed')
        .where('created_at', '>=', knex.raw("DATE_SUB(NOW(), INTERVAL 30 DAY)"));
      
      return {
        text: `📊 Counterfeit Statistics (Last 30 Days):\n\n` +
              `Total Reports: ${stats[0].total}\n` +
              `Confirmed Cases: ${confirmed[0].total}\n` +
              `Detection Rate: ${((confirmed[0].total / stats[0].total) * 100).toFixed(1)}%\n\n` +
              `Stay vigilant and keep reporting suspicious products!`,
        actions: [
          { type: 'hotspots', label: 'View Hotspots' }
        ]
      };
    }
    
    // Check for location-based query
    if (entities.locations && entities.locations.length > 0) {
      const location = entities.locations[0];
      const locationReports = await knex('counterfeit_reports')
        .count('* as total')
        .whereRaw('ST_Distance_Sphere(location, POINT(?, ?)) < 50000', [28.0473, -26.2041]); // Example coords
      
      return {
        text: `📍 ${location} Area Update:\n\n` +
              `Recent counterfeit reports: ${locationReports[0].total}\n` +
              `Risk Level: ${locationReports[0].total > 10 ? 'High' : 'Moderate'}\n\n` +
              `Always verify products before purchase in high-risk areas.`,
        actions: [
          { type: 'alerts', label: 'Set Location Alerts' }
        ]
      };
    }
    
    // Default response
    return {
      text: `I understand you're asking about "${message}". ` +
            `I can help you verify products, report counterfeits, track items, or manage your rewards. ` +
            `What would you like to do?`,
      actions: [
        { type: 'verify', label: 'Verify Product' },
        { type: 'report', label: 'Report Issue' },
        { type: 'help', label: 'Get Help' }
      ]
    };
  }

  // Get chat insights for analytics
  async getChatInsights(startDate, endDate) {
    const sessions = await knex('ai_chat_sessions')
      .whereBetween('created_at', [startDate, endDate])
      .select('intent', 'resolution_status');
    
    const insights = {
      totalSessions: sessions.length,
      intents: {},
      resolutionRate: 0
    };
    
    sessions.forEach(session => {
      if (session.intent) {
        insights.intents[session.intent] = (insights.intents[session.intent] || 0) + 1;
      }
    });
    
    const resolved = sessions.filter(s => s.resolution_status === 'resolved').length;
    insights.resolutionRate = sessions.length > 0 ? (resolved / sessions.length) * 100 : 0;
    
    return insights;
  }
}

module.exports = new AIChatService();