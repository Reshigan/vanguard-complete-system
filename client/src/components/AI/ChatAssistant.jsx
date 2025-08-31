import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, TrendingUp, Shield, X } from 'lucide-react';
import { api } from '../../services/api';

const ChatAssistant = ({ isOpen, onClose, sessionType = 'analytics' }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [insights, setInsights] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      startChatSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChatSession = async () => {
    try {
      const response = await api.post('/analytics/ai/chat/start', { sessionType });
      setSessionId(response.data.data.sessionId);
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        content: response.data.data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/analytics/ai/chat/message', {
        sessionId,
        message: inputMessage
      });

      const { response: aiResponse, insights: newInsights, suggestedActions: actions } = response.data.data;

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);

      if (newInsights && newInsights.length > 0) {
        setInsights(prev => [...prev, ...newInsights]);
      }

      if (actions && actions.length > 0) {
        setSuggestedActions(actions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = async () => {
    if (sessionId) {
      try {
        await api.post('/analytics/ai/chat/end', { sessionId });
      } catch (error) {
        console.error('Error ending chat session:', error);
      }
    }
    setSessionId(null);
    setMessages([]);
    setInsights([]);
    setSuggestedActions([]);
    onClose();
  };

  const getSuggestions = () => {
    const suggestions = {
      analytics: [
        "Show me repeat offenders in the last month",
        "Analyze high-risk channels in my region",
        "What are the counterfeit hotspots?",
        "Predict future risk areas"
      ],
      investigation: [
        "Track user patterns for suspicious activity",
        "Find all reports from a specific location",
        "Identify bulk validation attempts",
        "Show channel trust score trends"
      ],
      support: [
        "How do I report a counterfeit?",
        "What rewards can I earn?",
        "How does the validation process work?",
        "What should I do if I find a fake product?"
      ]
    };

    return suggestions[sessionType] || suggestions.support;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm text-gray-500">
                {sessionType === 'analytics' && 'Analytics & Insights'}
                {sessionType === 'investigation' && 'Investigation Mode'}
                {sessionType === 'support' && 'Support Assistant'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[70%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      message.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Bot className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="p-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your anti-counterfeiting data..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          {(insights.length > 0 || suggestedActions.length > 0) && (
            <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
              {/* Insights */}
              {insights.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                    Key Insights
                  </h3>
                  <div className="space-y-2">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          insight.severity === 'critical' 
                            ? 'bg-red-50 border-red-200' 
                            : insight.severity === 'high'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <p className="text-sm font-medium">{insight.description}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Action: {insight.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              {suggestedActions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Suggested Actions
                  </h3>
                  <div className="space-y-2">
                    {suggestedActions.map((action, index) => (
                      <a
                        key={index}
                        href={action.link}
                        className="block p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors"
                      >
                        <p className="text-sm font-medium text-blue-600">
                          {action.action}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;