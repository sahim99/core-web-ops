import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUnreadCount } from '../api/inbox.api'
import { getAlertCount } from '../api/alerts.api'

const GlobalDataContext = createContext()

export function GlobalDataProvider({ children }) {
  const { user } = useAuth()

  // State — only inbox + alerts (chat moved to ChatProvider)
  const [inboxUnread, setInboxUnread] = useState(0)
  const [alertUnread, setAlertUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch counts only (no more message polling)
  const fetchCounts = useCallback(async () => {
    if (!user) return
    try {
      const [inboxRes, alertRes] = await Promise.all([
        getUnreadCount().catch(() => ({ data: { count: 0 } })),
        getAlertCount().catch(() => ({ data: { count: 0 } })),
      ])
      setInboxUnread(inboxRes.data.count)
      setAlertUnread(alertRes.data.count)
    } catch (err) {
      console.error('Failed to fetch global counts', err)
    }
  }, [user])

  // Polling for inbox/alert counts (30s)
  useEffect(() => {
    if (!user) {
      setInboxUnread(0)
      setAlertUnread(0)
      return
    }

    const init = async () => {
      setLoading(true)
      await fetchCounts()
      setLoading(false)
    }
    init()

    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [user, fetchCounts])

  const value = {
    inboxUnread,
    alertUnread,
    refreshGlobalData: fetchCounts,
    loading,
  }

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  )
}

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext)
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider')
  }
  return context
}
