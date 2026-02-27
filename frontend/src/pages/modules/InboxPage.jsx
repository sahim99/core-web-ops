import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import MessageBubble from '../../components/inbox/MessageBubble'
import {
  listConversations,
  getConversation,
  addMessage,
  markRead,
} from '../../api/inbox.api'

// Icons
import { 
  PaperAirplaneIcon, 
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArchiveBoxIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function InboxPage() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null) // conversation ID
  const [detail, setDetail] = useState(null) // full conversation object
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = useCallback(async () => {
    try {
      const res = await listConversations({})
      setConversations(res.data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (detail) scrollToBottom()
  }, [detail])

  const selectConversation = async (conv) => {
    setSelected(conv.id)
    try {
      const res = await getConversation(conv.id)
      setDetail(res.data)
      if (!conv.is_read) {
        await markRead(conv.id)
        fetchConversations()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load conversation')
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selected) return
    setSending(true)
    try {
      await addMessage(selected, { 
        content: replyText, 
        sender_type: 'business',
        message_type: 'manual'
      })
      setReplyText('')
      
      // Refresh conversation to see new message
      const res = await getConversation(selected)
      setDetail(res.data)
      fetchConversations()
    } catch (err) {
      console.error(err)
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const refreshConversation = async () => {
    if (selected) {
        const res = await getConversation(selected)
        setDetail(res.data)
        fetchConversations()
    }
  }

  // Helper to determine icon
  const getChannelIcon = (channel) => {
    switch(channel) {
      case 'email': return <EnvelopeIcon className="w-4 h-4" />
      case 'sms': return <PhoneIcon className="w-4 h-4" />
      case 'form': return <ChatBubbleLeftRightIcon className="w-4 h-4" /> // Use chat for form too? or doc icon?
      default: return <ChatBubbleLeftRightIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 flex overflow-hidden">
          
          {/* ── Pane 1: Conversation List (30%) ── */}
          <div className={`flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm transition-all duration-300 ${selected ? 'hidden lg:flex w-80' : 'flex w-full md:w-96'}`}>
            
            {/* Toolbar */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex gap-2 shrink-0">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                <input 
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Search..."
                />
              </div>
              <button className="p-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No conversations found</div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-colors ${selected === conv.id ? 'bg-[var(--bg-glass-hover)] border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <span className={`p-1.5 rounded-full shrink-0 ${conv.channel === 'email' ? 'bg-blue-500/10 text-blue-400' : conv.channel === 'form' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                           {getChannelIcon(conv.channel)}
                         </span>
                         <span className={`font-medium text-sm truncate ${!conv.is_read ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                           {conv.contact_name || 'Unknown'}
                         </span>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] shrink-0 ml-2">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`text-sm mb-1 truncate ${!conv.is_read ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                      {conv.subject || '(No Subject)'}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {conv.last_message_preview}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Pane 2: Chat Area (Flex Grow) ── */}
          <div className={`flex-1 flex flex-col bg-[var(--bg-primary)] relative ${!selected ? 'hidden md:flex' : 'flex'}`}>
            {detail ? (
              <>
                {/* Header */}
                <div className="h-16 border-b border-[var(--border-subtle)] flex items-center justify-between px-6 bg-[var(--bg-secondary)]/30 shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelected(null)} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        ←
                    </button>
                    <div>
                        <h2 className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                        {detail.contact_name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-glass-hover)] text-[var(--text-muted)] font-normal border border-[var(--border-subtle)] capitalize">
                            {detail.channel}
                        </span>
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px] md:max-w-md">{detail.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-[var(--bg-glass-hover)] rounded-lg" title="Archive">
                        <ArchiveBoxIcon className="w-5 h-5" />
                     </button>
                     <button className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                     </button>
                  </div>
                </div>

                {/* Automation Paused Badge (Mock logic: if last msg is outbound manual) */}
                {detail.messages.length > 0 && detail.messages[detail.messages.length - 1].sender_type === 'business' && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
                     <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                     <span className="text-xs text-amber-500 font-medium uppercase tracking-wide">
                        Automation Paused • Staff Replied
                     </span>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                  {detail.messages.map(msg => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        onActionComplete={refreshConversation} 
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 shrink-0">
                   <form onSubmit={handleReply} className="relative max-w-4xl mx-auto">
                      <input 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl pl-4 pr-12 py-3.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-colors shadow-inner placeholder:text-[var(--text-secondary)]"
                        placeholder="Type your reply..."
                        disabled={sending}
                      />
                      <button 
                        type="submit"
                        disabled={sending || !replyText.trim()}
                        className="absolute right-2 top-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                      >
                         <PaperAirplaneIcon className="w-4 h-4" />
                      </button>
                   </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                 <ChatBubbleLeftRightIcon className="w-20 h-20 mb-6 opacity-10" />
                 <p className="text-lg font-medium text-[var(--text-secondary)]">Select a conversation</p>
                 <p className="text-sm text-[var(--text-secondary)]">to start chatting or view details</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}

export default InboxPage
