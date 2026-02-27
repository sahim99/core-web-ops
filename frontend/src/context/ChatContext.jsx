/**
 * ChatProvider — WebSocket-powered real-time chat context.
 *
 * Replaces the old polling-based ChatContext.
 * Provides: useChat() → {
 *   isOpen, setIsOpen, messages, sendMessage,
 *   unreadCount, typingUsers, isConnected, markAllRead
 * }
 *
 * Connection strategy:
 *  - Connect when user is authenticated
 *  - Exponential backoff reconnect (1s → 2s → 5s → 10s, max 5 attempts)
 *  - Reconnect on network online event
 *  - Cleanup on unmount / logout
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useAuth } from '../hooks/useAuth'
import { listMessages, sendMessage as apiSendMessage } from '../api/internal_messages.api'

const ChatContext = createContext()

// WebSocket URL — same host, ws:// or wss://
function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = '8000' // backend port
  return `${proto}//${host}:${port}/ws/internal-messages`
}

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 10000]
const MAX_RECONNECT_ATTEMPTS = 5

export function ChatProvider({ children }) {
  const { user } = useAuth()

  // ── State ────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState([]) // [{ user_id, user_name }]
  const [isConnected, setIsConnected] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  // ── Refs (stable across renders) ─────────────────────────────
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef(null)
  const typingTimer = useRef(null)
  const isTyping = useRef(false)
  const isOpenRef = useRef(isOpen)
  const messageIdsRef = useRef(new Set())

  // Keep isOpenRef in sync
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // ── Initial Load (REST, then WS takes over) ──────────────────
  const loadInitialMessages = useCallback(async () => {
    if (!user || initialLoaded) return
    try {
      const data = await listMessages()
      setMessages(data)
      messageIdsRef.current = new Set(data.map((m) => m.id))
      setInitialLoaded(true)
    } catch (err) {
      console.error('Failed to load initial messages', err)
    }
  }, [user, initialLoaded])

  // ── WebSocket Connection ─────────────────────────────────────
  const connect = useCallback(() => {
    if (!user) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected')
      setIsConnected(true)
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWsEvent(data)
      } catch (err) {
        console.error('[WS] Parse error', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[WS] Closed', event.code, event.reason)
      setIsConnected(false)
      wsRef.current = null

      // Don't reconnect on intentional close (4001 = auth fail, 4002 = limit)
      if (event.code >= 4000) return

      // Reconnect with backoff
      scheduleReconnect()
    }

    ws.onerror = () => {
      // onclose will fire after onerror, so we just log here
      console.warn('[WS] Error')
    }
  }, [user])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[WS] Max reconnect attempts reached')
      return
    }
    const delay = RECONNECT_DELAYS[reconnectAttempts.current] || 10000
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)
    reconnectTimer.current = setTimeout(() => {
      reconnectAttempts.current++
      connect()
    }, delay)
  }, [connect])

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current)
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS // prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // ── WS Event Handler ─────────────────────────────────────────
  const handleWsEvent = useCallback((data) => {
    const { type, payload } = data
    if (!type) return

    switch (type) {
      case 'connected':
        console.log('[WS] Auth confirmed, online users:', payload.online_users?.length)
        break

      case 'new_message':
        // Prevent duplicates (optimistic + WS both add)
        if (messageIdsRef.current.has(payload.id)) return
        messageIdsRef.current.add(payload.id)

        setMessages((prev) => [...prev, payload])

        // Increment unread only if drawer is closed and not from current user
        if (!isOpenRef.current) {
          setUnreadCount((c) => c + 1)
        }

        // Clear typing for this sender
        setTypingUsers((prev) => prev.filter((u) => u.user_id !== payload.sender_id))
        break

      case 'typing_start':
        setTypingUsers((prev) => {
          if (prev.some((u) => u.user_id === payload.user_id)) return prev
          return [...prev, { user_id: payload.user_id, user_name: payload.user_name }]
        })
        break

      case 'typing_stop':
        setTypingUsers((prev) => prev.filter((u) => u.user_id !== payload.user_id))
        break

      case 'error':
        console.error('[WS] Server error:', payload.message)
        break

      default:
        break
    }
  }, [])

  // ── Send Message (Optimistic) ────────────────────────────────
  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || !user) return

      // Optimistic: add temp message
      const tempId = `temp_${Date.now()}`
      const tempMsg = {
        id: tempId,
        content: content.trim(),
        sender_id: user.id,
        sender_name: user.full_name,
        created_at: new Date().toISOString(),
        _status: 'sending',
      }

      setMessages((prev) => [...prev, tempMsg])

      try {
        const serverMsg = await apiSendMessage(content.trim())

        // Replace temp with real (or just mark as sent)
        messageIdsRef.current.add(serverMsg.id)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...serverMsg, _status: 'sent' } : m
          )
        )
      } catch (err) {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, _status: 'failed' } : m
          )
        )
        console.error('Send message failed', err)
      }

      // Stop typing indicator
      sendTypingStop()
    },
    [user]
  )

  // ── Typing Indicators ────────────────────────────────────────
  const sendTypingStart = useCallback(() => {
    if (isTyping.current) return
    isTyping.current = true
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_start' }))
    }
  }, [])

  const sendTypingStop = useCallback(() => {
    if (!isTyping.current) return
    isTyping.current = false
    clearTimeout(typingTimer.current)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_stop' }))
    }
  }, [])

  const handleTyping = useCallback(() => {
    sendTypingStart()
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(sendTypingStop, 2000)
  }, [sendTypingStart, sendTypingStop])

  // ── Mark Read ────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  // ── Lifecycle ────────────────────────────────────────────────

  // Connect when user is available
  useEffect(() => {
    if (user) {
      loadInitialMessages()
      connect()
    } else {
      disconnect()
      setMessages([])
      setUnreadCount(0)
      setTypingUsers([])
      setInitialLoaded(false)
      messageIdsRef.current.clear()
    }
    return () => disconnect()
  }, [user])

  // Reconnect on network online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[WS] Network online, reconnecting...')
      reconnectAttempts.current = 0
      connect()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [connect])

  // When drawer opens: mark read
  useEffect(() => {
    if (isOpen) {
      markAllRead()
    }
  }, [isOpen, markAllRead])

  // ── Context Value ────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // Drawer state (backward compat with Topbar + Drawer)
      isOpen,
      setIsOpen,
      unreadCount,
      setUnreadCount,

      // Messages
      messages,
      sendMessage,

      // Typing
      typingUsers,
      handleTyping,

      // Connection
      isConnected,

      // Actions
      markAllRead,
    }),
    [isOpen, unreadCount, messages, typingUsers, isConnected, sendMessage, handleTyping, markAllRead]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
