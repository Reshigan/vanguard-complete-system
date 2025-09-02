/**
 * Vanguard Anti-Counterfeiting System - AI Chat Service
 * 
 * This service provides AI-powered chat capabilities for:
 * - Answering questions about product authenticity
 * - Guiding users through the verification process
 * - Helping with counterfeit reporting
 * - Providing insights on suspicious patterns
 * - Analyzing distribution channels
 */

const { OpenAI } = require('openai');
const mongoose = require('mongoose');
const { ChatMessage, User, Product, Validation, Report, Channel, AnomalyResult } = require('../../models');
const logger = require('../../utils/logger');
const config = require('../../config');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// System prompt for different user roles
const SYSTEM_PROMPTS = {
  consumer: `You are Vanguard AI, an assistant for the Vanguard Anti-Counterfeiting System. 
You help consumers verify product authenticity and report counterfeits.
Be friendly, helpful, and concise. Focus on guiding users through the verification process,
explaining how to identify counterfeits, and assisting with reporting suspicious products.
Encourage users to earn rewards by verifying products and reporting counterfeits.
If users ask about specific products or tokens, ask them to use the verification tool instead of the chat.
Never make up information about specific products or verification results.`,

  manufacturer: `You are Vanguard AI, an analytics assistant for the Vanguard Anti-Counterfeiting System.
You help manufacturers analyze verification data, identify suspicious patterns, and monitor distribution channels.
Be professional, data-focused, and insightful. Provide actionable intelligence about potential counterfeiting issues.
When asked about analytics, suggest checking the dashboard for real-time data.
Focus on helping manufacturers understand which channels are trustworthy and which might be problematic.
Highlight the importance of monitoring customer complaints and verification patterns.
Never make up specific statistics or data points that you don't have access to.`,

  admin: `You are Vanguard AI, an advanced analytics assistant for the Vanguard Anti-Counterfeiting System administrators.
You provide in-depth analysis of system data, help identify sophisticated counterfeiting operations,
and offer strategic recommendations for improving the anti-counterfeiting measures.
Be comprehensive, technical, and precise. Focus on system-wide patterns, ML model performance,
and advanced threat detection. Provide guidance on investigating complex cases and improving security measures.
When discussing ML capabilities, emphasize the system's ability to detect anomalies, identify repeat offenders,
and analyze distribution channel risks. Suggest using the analytics dashboard for detailed data visualization.
Never make up specific statistics or data points that you don't have access to.`
};

/**
 * Process a chat message and generate a response
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @returns {Promise<Object>} - AI response
 */
async function processMessage(userId, message) {
  try {
    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's chat history (last 10 messages)
    const history = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Reverse to get chronological order
    history.reverse();
    
    // Create conversation context
    const systemPrompt = SYSTEM_PROMPTS[user.role] || SYSTEM_PROMPTS.consumer;
    
    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add conversation history
    history.forEach(msg => {
      messages.push(
        { role: 'user', content: msg.userMessage },
        { role: 'assistant', content: msg.aiResponse }
      );
    });
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    // Enhance with relevant context based on message content
    await enhanceWithContext(messages, message, user);
    
    // Generate response
    const completion = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Save message to database
    const chatMessage = new ChatMessage({
      user: userId,
      userMessage: message,
      aiResponse: aiResponse,
      createdAt: new Date()
    });
    
    await chatMessage.save();
    
    return {
      message: aiResponse,
      messageId: chatMessage._id
    };
  } catch (error) {
    logger.error('Error processing chat message:', error);
    throw error;
  }
}

/**
 * Enhance messages with relevant context based on message content
 * @param {Array} messages - Messages array
 * @param {string} userMessage - Current user message
 * @param {Object} user - User object
 */
async function enhanceWithContext(messages, userMessage, user) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if message is about verification
  if (lowerMessage.includes('verify') || lowerMessage.includes('authentic') || 
      lowerMessage.includes('fake') || lowerMessage.includes('counterfeit') ||
      lowerMessage.includes('check') || lowerMessage.includes('real')) {
    
    // Add verification process information
    messages.push({
      role: 'system',
      content: `Verification information: Users can verify products by scanning the QR code on the product or entering the authentication token manually. Each successful verification earns 10 points. If a product is identified as potentially counterfeit, users can report it for investigation and earn additional points if the report is confirmed.`
    });
  }
  
  // Check if message is about reporting
  if (lowerMessage.includes('report') || lowerMessage.includes('suspicious') || 
      lowerMessage.includes('found a fake') || lowerMessage.includes('counterfeit')) {
    
    // Add reporting process information
    messages.push({
      role: 'system',
      content: `Reporting information: To report a counterfeit product, users should:
1. Verify the product first using the scan feature
2. If the verification fails, click "Report Counterfeit"
3. Provide details about where they purchased the product
4. Add any additional information that might help the investigation
5. Submit photos if possible
Confirmed reports earn 50 points and help protect other consumers.`
    });
  }
  
  // Check if message is about rewards
  if (lowerMessage.includes('reward') || lowerMessage.includes('point') || 
      lowerMessage.includes('earn') || lowerMessage.includes('gift')) {
    
    // Add rewards information
    messages.push({
      role: 'system',
      content: `Rewards information: Users earn points through various activities:
- 10 points for each product verification
- 50 points for confirmed counterfeit reports
- 25 points for maintaining a daily verification streak
- 100 points for referring new users
- 50 points for signing up
Points can be redeemed for discounts, free products, exclusive experiences, and digital badges. The user currently has ${user.points || 0} points.`
    });
  }
  
  // For manufacturers and admins, add analytics context
  if ((user.role === 'manufacturer' || user.role === 'admin') && 
      (lowerMessage.includes('analytics') || lowerMessage.includes('dashboard') || 
       lowerMessage.includes('data') || lowerMessage.includes('statistics') ||
       lowerMessage.includes('channel') || lowerMessage.includes('pattern'))) {
    
    // Get some basic analytics data
    const totalValidations = await Validation.countDocuments();
    const counterfeitCount = await Validation.countDocuments({ result: 'counterfeit' });
    const reportCount = await Report.countDocuments();
    const confirmedReports = await Report.countDocuments({ status: 'confirmed' });
    const flaggedChannels = await Channel.countDocuments({ status: 'flagged' });
    const anomalyCount = await AnomalyResult.countDocuments();
    
    // Add analytics information
    messages.push({
      role: 'system',
      content: `Analytics information: The system has recorded ${totalValidations} total validations, with ${counterfeitCount} identified as potential counterfeits. There have been ${reportCount} user reports, of which ${confirmedReports} were confirmed as counterfeits. The system has flagged ${flaggedChannels} distribution channels as potentially problematic and detected ${anomalyCount} anomalies in verification patterns. The dashboard provides real-time visualizations of this data, including geographic heat maps, channel performance metrics, and trend analysis.`
    });
  }
  
  // For admins, add ML model information
  if (user.role === 'admin' && 
      (lowerMessage.includes('ml') || lowerMessage.includes('machine learning') || 
       lowerMessage.includes('ai') || lowerMessage.includes('model') ||
       lowerMessage.includes('algorithm') || lowerMessage.includes('predict'))) {
    
    // Add ML model information
    messages.push({
      role: 'system',
      content: `ML model information: The system uses three primary machine learning models:
1. Anomaly Detection Model: Identifies unusual patterns in verification behavior that may indicate counterfeiting activity
2. Channel Risk Model: Evaluates distribution channels based on verification history and assigns risk scores
3. Repeat Offender Model: Identifies users who repeatedly encounter or report counterfeit products
These models are regularly trained on system data and have achieved accuracy rates between 85-95%. The models help identify suspicious patterns that might not be obvious through manual analysis.`
    });
  }
}

/**
 * Get chat history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of messages to return
 * @returns {Promise<Array>} - Chat history
 */
async function getChatHistory(userId, limit = 50) {
  try {
    const history = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return history.reverse();
  } catch (error) {
    logger.error('Error getting chat history:', error);
    throw error;
  }
}

/**
 * Delete a chat message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMessage(messageId, userId) {
  try {
    const result = await ChatMessage.deleteOne({
      _id: messageId,
      user: userId
    });
    
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting chat message:', error);
    throw error;
  }
}

/**
 * Clear chat history for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of deleted messages
 */
async function clearChatHistory(userId) {
  try {
    const result = await ChatMessage.deleteMany({ user: userId });
    return result.deletedCount;
  } catch (error) {
    logger.error('Error clearing chat history:', error);
    throw error;
  }
}

module.exports = {
  processMessage,
  getChatHistory,
  deleteMessage,
  clearChatHistory
};