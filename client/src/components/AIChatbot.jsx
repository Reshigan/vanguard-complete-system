import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User,
  Loader,
  Minimize2,
  Maximize2,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Package
} from 'lucide-react'

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your AI assistant for the Vanguard Anti-Counterfeiting System. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickActions = [
    { icon: AlertTriangle, text: "Report counterfeit", action: "I want to report a counterfeit product" },
    { icon: CheckCircle, text: "Verify product", action: "How do I verify a product?" },
    { icon: TrendingUp, text: "View analytics", action: "Show me the latest analytics" },
    { icon: Package, text: "Product info", action: "Tell me about product authentication" }
  ]

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('counterfeit') || lowerMessage.includes('fake')) {
      return {
        text: "I can help you with counterfeit detection. Here's what you need to know:\n\n1. **Immediate Actions**: If you've found a counterfeit product, please report it immediately through the Reports section.\n\n2. **Verification**: Always scan the NXT Tag to verify authenticity before purchase.\n\n3. **Red Flags**: Look for unusual pricing, packaging defects, or unauthorized retailers.\n\nWould you like me to guide you through filing a counterfeit report?",
        suggestions: ["File a report", "View counterfeit hotspots", "Contact support"]
      }
    } else if (lowerMessage.includes('verify') || lowerMessage.includes('authenticate')) {
      return {
        text: "To verify a product's authenticity:\n\n1. **Scan NXT Tag**: Use your mobile device to scan the product's NXT Tag\n2. **Check Results**: You'll instantly see if the product is authentic\n3. **Earn Rewards**: Get points for every verification!\n\nThe system has a 99.9% accuracy rate. Would you like to know more about the verification process?",
        suggestions: ["Start scanning", "View rewards", "Learn about NXT Tags"]
      }
    } else if (lowerMessage.includes('analytics') || lowerMessage.includes('statistics')) {
      return {
        text: "Here are your current analytics highlights:\n\n📊 **Total Validations**: 45,678 (+15.3%)\n✅ **Authenticity Rate**: 94.2%\n🚨 **Counterfeits Detected**: 342\n👥 **Active Users**: 12,450\n\nTop performing channels:\n1. Tops at SPAR (94% authenticity)\n2. Pick n Pay Liquor (96% authenticity)\n3. Makro Liquor (92% authenticity)\n\nWould you like to see more detailed analytics?",
        suggestions: ["View full analytics", "Export report", "Channel performance"]
      }
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return {
        text: "I'm here to help! Here are the main areas I can assist with:\n\n🔍 **Product Verification**: Scan and authenticate products\n📊 **Analytics**: View performance metrics and insights\n🚨 **Counterfeit Reporting**: Report suspicious products\n🎁 **Rewards**: Track your points and rewards\n📦 **Product Management**: Manage your product catalog\n\nWhat would you like help with?",
        suggestions: ["Product verification", "View analytics", "Report issue", "Contact human support"]
      }
    } else if (lowerMessage.includes('reward') || lowerMessage.includes('points')) {
      return {
        text: "Great question about rewards! Here's how our reward system works:\n\n🎯 **Earn Points**:\n• 10 points per product scan\n• 50 points for first daily scan\n• 100-500 points for reporting counterfeits\n\n🏆 **Tier Benefits**:\n• Bronze (0-999 points): Basic rewards\n• Silver (1000-4999): 10% bonus points\n• Gold (5000-9999): 20% bonus + exclusive offers\n• Platinum (10000+): 30% bonus + VIP perks\n\nYou currently have 2,450 points (Silver tier). Keep scanning to reach Gold!",
        suggestions: ["View rewards catalog", "Check point history", "Redeem points"]
      }
    } else {
      return {
        text: `I understand you're asking about "${userMessage}". Let me help you with that.\n\nBased on your query, here are some relevant options:\n\n• Product verification and authentication\n• Analytics and reporting features\n• Counterfeit detection and prevention\n• Reward system and benefits\n\nPlease select one of these topics or ask a more specific question.`,
        suggestions: ["Product verification", "View analytics", "Learn more", "Contact support"]
      }
    }
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage)
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: botResponse.text,
        timestamp: new Date(),
        suggestions: botResponse.suggestions
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (action) => {
    setInputMessage(action)
    handleSendMessage()
  }

  const handleSuggestion = (suggestion) => {
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: suggestion,
      timestamp: new Date()
    }
    setMessages([...messages, userMessage])
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateBotResponse(suggestion)
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: botResponse.text,
        timestamp: new Date(),
        suggestions: botResponse.suggestions
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 z-50 flex items-center space-x-2"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="hidden md:inline font-medium">AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 transition-all duration-200 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                {!isMinimized && <p className="text-xs opacity-90">Always here to help</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 h-[400px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`p-2 rounded-full ${
                        message.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className={`p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                        </div>
                        {message.suggestions && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestion(suggestion)}
                                className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.action)}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <action.icon className="h-4 w-4 text-gray-600" />
                        <span className="text-xs text-gray-700">{action.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by Vanguard AI • Available 24/7
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default AIChatbot