import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { X, Send, MessageSquare, Wifi, WifiOff } from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

/* ── Date Separator ────────────────────────────────────────────── */
function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ── Typing Indicator ──────────────────────────────────────────── */
const TypingIndicator = memo(function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null
  const names = users.map((u) => u.user_name).join(', ')
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[10px] text-[var(--text-muted)] font-medium">
        {names} {users.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  )
})

/* ── Message Bubble ────────────────────────────────────────────── */
const MessageBubble = memo(function MessageBubble({ msg, isMe, showSender }) {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && showSender && (
        <span className="text-[10px] text-[var(--text-muted)] ml-1 mb-1 font-medium">
          {msg.sender_name}
        </span>
      )}
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm shadow-md ${
          isMe
            ? 'bg-indigo-600 text-[var(--text-primary)] rounded-2xl rounded-br-sm'
            : 'bg-white/10 text-[var(--text-primary)] rounded-2xl rounded-bl-sm border border-[var(--border-subtle)]'
        } ${msg._status === 'sending' ? 'opacity-60' : ''} ${
          msg._status === 'failed' ? 'border border-rose-500/30' : ''
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
      </div>
      <div className="flex items-center gap-1 mt-0.5 mx-1">
        <span className="text-[9px] text-[var(--text-secondary)] opacity-60">
          {new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {msg._status === 'sending' && (
          <span className="text-[8px] text-[var(--text-secondary)]">⏳</span>
        )}
        {msg._status === 'failed' && (
          <span className="text-[8px] text-rose-400">✕ Failed</span>
        )}
      </div>
    </div>
  )
})

/* ── Main Drawer Component ─────────────────────────────────────── */
export default function InternalMessageDrawer() {
  const {
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    typingUsers,
    handleTyping,
    isConnected,
    unreadCount,
  } = useChat()
  const { user } = useAuth()

  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isAtBottom = useRef(true)

  // Track if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }, [])

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (isOpen && isAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Scroll to bottom when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        isAtBottom.current = true
      }, 100)
    }
  }, [isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    await sendMessage(newMessage)
    setNewMessage('')
    // Force scroll to bottom after send
    isAtBottom.current = true
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    handleTyping() // Notify typing
  }

  if (!user) return null

  // Group messages: add date separators + detect consecutive same sender
  const enrichedMessages = []
  let lastDate = null
  let lastSenderId = null

  for (const msg of messages) {
    const dateLabel = formatDateLabel(msg.created_at)
    if (dateLabel !== lastDate) {
      enrichedMessages.push({ _type: 'date_sep', label: dateLabel, key: `date_${dateLabel}_${msg.id}` })
      lastDate = dateLabel
      lastSenderId = null // Reset sender grouping on new date
    }
    const showSender = msg.sender_id !== lastSenderId
    enrichedMessages.push({ ...msg, _showSender: showSender })
    lastSenderId = msg.sender_id
  }

  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-screen w-full md:w-[380px] bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-l border-[var(--border-default)] shadow-2xl z-[999] transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-default)] bg-[var(--bg-glass-hover)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-4 h-4 text-[var(--text-primary)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Team Chat</h2>
              <p className="text-[10px] font-medium flex items-center gap-1">
                {isConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-amber-400">Reconnecting...</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-xs text-center px-8">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-glass-hover)] flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 opacity-20" />
              </div>
              <p>Welcome to the global team chat!</p>
              <p className="mt-1 opacity-50">
                Messages here are visible to everyone in your workspace.
              </p>
            </div>
          )}

          {enrichedMessages.map((item, i) => {
            if (item._type === 'date_sep') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-[var(--bg-glass-hover)]" />
                  <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                  <div className="flex-1 h-px bg-[var(--bg-glass-hover)]" />
                </div>
              )
            }

            return (
              <MessageBubble
                key={item.id}
                msg={item}
                isMe={item.sender_id == user.id}
                showSender={item._showSender}
              />
            )
          })}

          <TypingIndicator users={typingUsers} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-[var(--bg-glass-hover)] border-t border-[var(--border-default)] shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl pl-4 pr-12 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-[var(--text-secondary)] shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
