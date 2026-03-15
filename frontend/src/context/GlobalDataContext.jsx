import { createContext, useContext, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { getUnreadCount } from '../api/inbox.api'
import { getAlertCount } from '../api/alerts.api'

const GlobalDataContext = createContext()

export function GlobalDataProvider({ children }) {
  const { user } = useAuth()

  // Fetch counts efficiently with React Query
  const { data: inboxRes, refetch: refetchInbox } = useQuery({
    queryKey: ['inboxUnread'],
    queryFn: () => getUnreadCount().catch(() => ({ data: { count: 0 } })),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 30000,
  })
  
  const { data: alertRes, refetch: refetchAlert, isLoading } = useQuery({
    queryKey: ['alertUnread'],
    queryFn: () => getAlertCount().catch(() => ({ data: { count: 0 } })),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 30000,
  })

  const inboxUnread = inboxRes?.data?.count || 0
  const alertUnread = alertRes?.data?.count || 0

  const refreshGlobalData = useCallback(() => {
    refetchInbox()
    refetchAlert()
  }, [refetchInbox, refetchAlert])

  const value = {
    inboxUnread,
    alertUnread,
    refreshGlobalData,
    loading: isLoading,
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
