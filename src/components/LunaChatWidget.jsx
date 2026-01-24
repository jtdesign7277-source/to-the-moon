import { useState, useRef, useEffect } from 'react'
import { X, Send, MessageCircle, Sparkles, ArrowRight, Paperclip, Smile, Mic, UserCircle, Mail, Bot } from 'lucide-react'
import api from '../utils/api'
import { useApp } from '../hooks/useApp'

// Luna Avatar - Elegant constellation of stars with slow rotation
const LunaAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`${sizes[size]} ${className} relative`}>
      <div className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <filter id="lunaStarGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="lunaMainStarGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="lunaLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          <line x1="50" y1="30" x2="28" y2="55" stroke="url(#lunaLineGradient)" strokeWidth="1" />
          <line x1="50" y1="30" x2="72" y2="55" stroke="url(#lunaLineGradient)" strokeWidth="1" />
          <line x1="28" y1="55" x2="50" y2="78" stroke="url(#lunaLineGradient)" strokeWidth="1" />
          <line x1="72" y1="55" x2="50" y2="78" stroke="url(#lunaLineGradient)" strokeWidth="1" />
          <line x1="28" y1="55" x2="72" y2="55" stroke="url(#lunaLineGradient)" strokeWidth="1" />
          
          <circle cx="50" cy="30" r="8" fill="#c4b5fd" filter="url(#lunaMainStarGlow)" />
          <circle cx="50" cy="30" r="5" fill="#e9d5ff" />
          <circle cx="50" cy="30" r="2.5" fill="#ffffff" />
          
          <circle cx="28" cy="55" r="6" fill="#a78bfa" filter="url(#lunaStarGlow)" />
          <circle cx="28" cy="55" r="3.5" fill="#ddd6fe" />
          <circle cx="28" cy="55" r="1.5" fill="#ffffff" />
          
          <circle cx="72" cy="55" r="6" fill="#a78bfa" filter="url(#lunaStarGlow)" />
          <circle cx="72" cy="55" r="3.5" fill="#ddd6fe" />
          <circle cx="72" cy="55" r="1.5" fill="#ffffff" />
          
          <circle cx="50" cy="78" r="5" fill="#8b5cf6" filter="url(#lunaStarGlow)" />
          <circle cx="50" cy="78" r="3" fill="#c4b5fd" />
          <circle cx="50" cy="78" r="1.5" fill="#ffffff" />
          
          <circle cx="38" cy="42" r="1.5" fill="#e9d5ff" opacity="0.8" />
          <circle cx="62" cy="42" r="1.5" fill="#e9d5ff" opacity="0.8" />
          <circle cx="50" cy="55" r="2" fill="#ddd6fe" opacity="0.9" />
        </svg>
      </div>
      
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke="#8b5cf6" 
            strokeWidth="1" 
            opacity="0.3"
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </svg>
      </div>
    </div>
  )
}

const LunaChatWidget = ({ user }) => {
  const { showLunaChat, closeLunaChat } = useApp()
  const [message, setMessage] = useState('')
  const [talkToHuman, setTalkToHuman] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi there! You're speaking with Luna, your AI trading assistant. I'm well trained and ready to assist you today, but you can ask for the team at any time.",
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isTyping])

  // Quick action buttons
  const quickActions = [
    { label: 'How can I help?', action: () => handleQuickAction('How can I help?') },
  ]

  const handleQuickAction = async (prompt) => {
    setMessage('')
    setChatMessages(prev => [...prev, { role: 'user', content: prompt, timestamp: new Date() }])
    setIsTyping(true)
    
    try {
      const response = await api.post('/support/chat', {
        message: prompt,
        history: chatMessages.slice(-10)
      })
      
      if (response.data.success) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message,
          timestamp: new Date()
        }])
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I can help you with trading strategies, market analysis, platform navigation, account questions, and more. Just ask!",
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I can help you with trading strategies, market analysis, platform navigation, account questions, and more. Just ask!",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return
    
    const userMessage = message.trim()
    setMessage('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }])
    setIsTyping(true)
    
    try {
      const response = await api.post('/support/chat', {
        message: userMessage,
        history: chatMessages.slice(-10)
      })
      
      if (response.data.success) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message,
          timestamp: new Date()
        }])
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message || "I'm having trouble right now. Please try again or click the human support icon for help! 📧",
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm temporarily unavailable. Click the human support icon to email our team! 📧",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendHumanMessage = () => {
    if (!message.trim()) return
    const subject = encodeURIComponent('Support Request - Stratify')
    const body = encodeURIComponent(`From: ${user?.email || 'User'}\n\nMessage:\n${message}`)
    window.open(`mailto:support@stratify.app?subject=${subject}&body=${body}`)
    setMessage('')
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "Opening your email client... Our team will get back to you within 24 hours! 📬",
      timestamp: new Date()
    }])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (talkToHuman) {
        handleSendHumanMessage()
      } else {
        handleSendMessage()
      }
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <>
      {/* Chat Widget Panel - slides up from bottom right when opened from user menu */}
      {showLunaChat && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-gray-100">
          {/* Header */}
          <div className="bg-linear-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute w-1 h-1 bg-white rounded-full top-2 left-8 animate-pulse" />
              <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-4 left-20 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="absolute w-1 h-1 bg-white rounded-full bottom-2 right-20 animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <LunaAvatar size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-slate-800 rounded-full" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  Luna
                  <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-[10px] text-purple-200 font-medium">AI Agent</span>
                </h3>
                <p className="text-slate-400 text-xs">The team can also help</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 relative">
              {/* Toggle human support */}
              <button
                onClick={() => setTalkToHuman(!talkToHuman)}
                className={`p-2 rounded-lg transition-colors ${talkToHuman ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                title={talkToHuman ? 'Switch to AI' : 'Talk to human'}
              >
                {talkToHuman ? <Bot className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
              </button>
              <button
                onClick={closeLunaChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Human Support Header - shows when in human mode */}
          {talkToHuman && (
            <div className="bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Human Support Mode</span>
                <span className="text-emerald-100 text-xs">• We reply within 24 hours</span>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-slate-50 to-white min-h-[300px] max-h-[380px]"
          >
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mt-1">
                      <LunaAvatar size="xs" />
                    </div>
                  )}
                  <div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'assistant' && idx === chatMessages.length - 1 && !isTyping && (
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        Luna • {formatTime(msg.timestamp || new Date())}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <LunaAvatar size="xs" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions - show after initial message if no other messages */}
            {chatMessages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-2 mt-3">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => action.action()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-3 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Add emoji">
                  <Smile className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Voice message">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={talkToHuman ? handleSendHumanMessage : handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="p-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all ml-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Luna AI</span>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default LunaChatWidget
