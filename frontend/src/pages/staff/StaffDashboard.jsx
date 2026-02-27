import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import {
  InboxIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CubeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

function StaffDashboard() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Brief loading state for animation
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  // Determine owner name (from user data or fallback)
  const ownerName = user?.owner_id ? `Owner #${user.owner_id}` : 'Administrator'

  // Work cards based on permissions
  const workCards = [
    {
      key: 'inbox',
      label: 'Inbox Messages',
      icon: <InboxIcon className="h-7 w-7" />,
      desc: 'Unread messages assigned to you',
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      route: '/inbox',
    },
    {
      key: 'bookings',
      label: 'My Bookings',
      icon: <CalendarDaysIcon className="h-7 w-7" />,
      desc: 'Pending appointments to manage',
      color: 'from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-500/20',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      route: '/bookings',
    },
    {
      key: 'forms',
      label: 'Form Submissions',
      icon: <DocumentTextIcon className="h-7 w-7" />,
      desc: 'New submissions requiring action',
      color: 'from-violet-500 to-violet-600',
      borderColor: 'border-violet-500/20',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-400',
      route: '/forms',
    },
    {
      key: 'inventory',
      label: 'Inventory Alerts',
      icon: <CubeIcon className="h-7 w-7" />,
      desc: 'Stock levels and reorder alerts',
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-500/20',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      route: '/inventory',
    },
  ]

  const visibleCards = workCards.filter(c => hasPermission(c.key))

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8 animate-pulse">
            <div className="h-8 w-64 bg-[var(--bg-glass-hover)] rounded mb-8" />
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-[var(--bg-glass-hover)] rounded-2xl" />)}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

            {/* Header */}
            <div className="border-b border-[var(--border-subtle)] pb-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-slate-600 to-slate-500 flex items-center justify-center text-[var(--text-primary)] font-bold text-lg shadow-lg">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">My Workspace</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider border border-slate-600/30">
                      Staff
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Reporting to: {ownerName}
                    </span>
                  </div>
                </div>
              </div>
              {user?.staff_id && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Staff ID</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-glass-hover)] text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {user.staff_id}
                  </span>
                </div>
              )}
            </div>

            {/* Work Overview */}
            <div>
              <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-5">
                My Work Overview
              </h2>

              {visibleCards.length === 0 ? (
                <div className="text-center p-16 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-subtle)]">
                  <UserCircleIcon className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">No modules assigned</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">Contact your workspace owner for access.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleCards.map(card => (
                    <button
                      key={card.key}
                      onClick={() => navigate(card.route)}
                      className={`text-left p-6 rounded-2xl border ${card.borderColor} bg-[var(--bg-secondary)] hover:bg-[#1a1a2e] transition-all group cursor-pointer relative overflow-hidden`}
                    >
                      {/* Glow effect */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${card.bgColor} ${card.textColor}`}>
                            {card.icon}
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)]/90 transition-colors">
                          {card.label}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{card.desc}</p>
                        <div className="mt-4 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                          Open module →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Quick Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Your Email</div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">{user?.email}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Status</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Modules</div>
                  <div className="text-sm text-[var(--text-secondary)]">{visibleCards.length} assigned</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Joined</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '–'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default StaffDashboard
