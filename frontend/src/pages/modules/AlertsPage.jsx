import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { listAlerts, getAlertCount, dismissAlert, dismissAllAlerts, syncInventoryAlerts } from '../../api/alerts.api'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ServerIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // all, critical, warning, info
  const [lastChecked, setLastChecked] = useState(new Date())

  const fetchAlerts = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const [alertsRes, countRes] = await Promise.all([
        listAlerts(),
        getAlertCount(),
      ])
      setAlerts(alertsRes.data)
      setUnreadCount(countRes.data.count)
      setLastChecked(new Date())
    } catch (err) {
      console.error('Failed to fetch alerts', err)
      toast.error('Could not refresh alerts')
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => {
    // Sync inventory low-stock alerts before fetching, so they appear immediately
    syncInventoryAlerts().catch(() => {}).finally(() => fetchAlerts())
  }, [])

  const handleDismiss = async (id) => {
    try {
      await dismissAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
      setUnreadCount(prev => Math.max(0, prev - 1))
      toast.success('Alert dismissed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to dismiss alert')
    }
  }

  const handleDismissAll = async () => {
    if (unreadCount === 0) return
    try {
      await dismissAllAlerts()
      fetchAlerts(true)
      toast.success('All alerts marked as read')
    } catch (err) {
      console.error(err)
      toast.error('Failed to dismiss all')
    }
  }

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.severity === filter
  })

  // Severity Configurations
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical': return { 
         bg: 'bg-red-500/10', 
         border: 'border-red-500/10', 
         text: 'text-red-400',
         icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
         badge: 'bg-red-500/10 text-red-400 border-red-500/20'
      }
      case 'warning': return { 
         bg: 'bg-amber-500/10', 
         border: 'border-amber-500/10', 
         text: 'text-amber-400',
         icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
         badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }
      default: return { 
         bg: 'bg-blue-500/10', 
         border: 'border-blue-500/10', 
         text: 'text-blue-400',
         icon: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
         badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      }
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 lg:px-12 lg:py-10">
          <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
             
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[var(--border-subtle)] pb-8">
                <div>
                   <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                      System Alerts
                   </h1>
                   <p className="text-[var(--text-muted)] mt-2 text-sm max-w-2xl">
                       Real-time monitoring of your workspace infrastructure, inventory levels, and automation triggers.
                   </p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button 
                        onClick={() => fetchAlerts(true)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-glass-hover)] hover:bg-white/10 rounded-lg transition-colors border border-[var(--border-subtle)]"
                        title="Refresh"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleDismissAll}
                            className="text-sm font-medium px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-colors flex items-center gap-2 border border-indigo-500/20"
                        >
                            <CheckBadgeIcon className="w-5 h-5" />
                            Mark all read
                        </button>
                    )}
                </div>
             </div>

             {/* Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border-subtle)] flex items-center gap-5">
                    <div className={`p-3 rounded-xl ${alerts.some(a => a.severity === 'critical' && !a.is_read) ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <ServerIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">System Status</div>
                        <div className={`text-base font-bold ${alerts.some(a => a.severity === 'critical' && !a.is_read) ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                            {alerts.some(a => a.severity === 'critical' && !a.is_read) ? 'Attention Needed' : 'Operational'}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border-subtle)] flex items-center gap-5">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Active Alerts</div>
                        <div className="text-base font-bold text-[var(--text-primary)]">
                            {unreadCount} <span className="text-sm font-medium text-[var(--text-secondary)]">unread</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border-subtle)] flex items-center gap-5">
                     <div className="p-3 rounded-xl bg-slate-700/30 text-[var(--text-muted)]">
                        <ClockIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Last Synced</div>
                        <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                            {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
             </div>

             {/* Filters */}
             <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-1">
                {['all', 'critical', 'warning', 'info'].map(type => (
                   <button
                     key={type}
                     onClick={() => setFilter(type)}
                     className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                         filter === type 
                         ? 'border-indigo-500 text-indigo-400' 
                         : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                     }`}
                   >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                   </button>
                ))}
             </div>

             {/* List */}
             <div className="space-y-4">
                {loading ? (
                   Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-24 bg-[var(--bg-secondary)] rounded-xl animate-pulse border border-[var(--border-subtle)]" />
                   ))
                ) : filteredAlerts.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-subtle)] border-dashed">
                      <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4 text-[var(--text-secondary)]">
                         <CheckCircleIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">No {filter !== 'all' ? filter : ''} alerts</h3>
                      <p className="text-[var(--text-secondary)] text-sm mt-1">System is running smoothly.</p>
                   </div>
                ) : (
                   filteredAlerts.map((alert) => {
                      const config = getSeverityConfig(alert.severity)
                      return (
                         <div 
                            key={alert.id}
                            className={`group p-5 rounded-xl border transition-all hover:bg-[var(--bg-secondary)] ${
                                alert.is_read 
                                ? 'bg-transparent border-[var(--border-subtle)] opacity-60 hover:opacity-100' 
                                : `bg-[var(--bg-secondary)]/50 border-l-4 ${config.border.replace('border', 'border-l')}`
                            }`}
                            style={{ borderLeftColor: !alert.is_read ? undefined : 'rgba(255,255,255,0.05)' }}
                         >
                            <div className="flex items-start gap-4">
                               <div className={`mt-1 shrink-0 ${config.text}`}>
                                  {config.icon}
                               </div>
                               
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                     <h4 className="text-base font-semibold text-[var(--text-primary)] truncate">
                                         {alert.title}
                                     </h4>
                                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badge}`}>
                                        {alert.severity}
                                     </span>
                                     {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>}
                                  </div>
                                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                      {alert.message}
                                  </p>
                                  <div className="mt-2 text-xs text-[var(--text-secondary)] font-mono">
                                      {new Date(alert.created_at).toLocaleString()}
                                  </div>
                               </div>

                               {!alert.is_read && (
                                  <button 
                                     onClick={() => handleDismiss(alert.id)}
                                     className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-lg transition-colors"
                                     title="Dismiss"
                                  >
                                     <XMarkIcon className="w-5 h-5" />
                                  </button>
                               )}
                            </div>
                         </div>
                      )
                   })
                )}
             </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default AlertsPage
