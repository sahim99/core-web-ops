import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useGlobalData } from '../../context/GlobalDataContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'

function Sidebar() {
  const { isOwner, hasPermission } = usePermissions()
  const { inboxUnread, alertUnread } = useGlobalData()
  const { isDark } = useTheme()
  const { isDemo } = useAuth()

  const navItems = [
    { to: '/dashboard', label: 'Monitor', icon: '📊', permission: null },
    { to: '/contacts', label: 'CRM', icon: '👥', permission: null },
    { to: '/inbox', label: 'Inbox', icon: '💬', badge: inboxUnread, permission: 'inbox' },
    { to: '/bookings', label: 'Bookings', icon: '📅', permission: 'bookings' },
    { to: '/forms', label: 'Forms', icon: '📝', permission: 'forms' },
    { to: '/inventory', label: 'Inventory', icon: '📦', permission: 'inventory' },
    { to: '/alerts', label: 'Alerts', icon: '🔔', badge: alertUnread, permission: null },
  ]

  const visibleNavItems = navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  const ownerItems = [
    { to: '/staff', label: 'Team', icon: '🛡️' },
    { to: '/automation', label: 'Automation Engine', icon: '⚡' },
  ]

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
      isActive
        ? isDark
          ? 'bg-primary-500/10 text-primary-400 border border-primary-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-indigo-50 text-indigo-600 border border-indigo-200/50 shadow-sm'
        : isDark
          ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] border border-transparent'
          : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`

  return (
    <aside className={`w-64 border-r flex-shrink-0 flex flex-col h-screen sticky top-0 z-30 ${
      isDark
        ? 'bg-[var(--bg-primary)] border-[var(--border-subtle)]'
        : 'bg-white border-slate-200'
    }`}>
      {/* Logo */}
      <div className={`h-16 flex items-center px-6 border-b ${
        isDark ? 'border-[var(--border-subtle)] bg-[var(--border-subtle)]' : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center text-[var(--text-primary)] font-bold shadow-lg shadow-primary-500/20">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>CoreWebOps</span>
            {isDemo && (
              <span className="text-[9px] font-black tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-md">
                DEMO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        <div>
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-80 ${
            isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
          }`}>
            Operations
          </div>
          <div className="space-y-0.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
              >
                <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity filter saturate-0 group-hover:saturate-100">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-primary-500 text-[var(--text-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm min-w-[1.25rem] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {isOwner && (
          <div>
            <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-80 ${
              isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
            }`}>
              Administration
            </div>
            <div className="space-y-0.5">
              {ownerItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass}
                >
                  <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity filter saturate-0 group-hover:saturate-100">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${isDark ? 'border-[var(--border-subtle)] bg-[var(--bg-primary)]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
            <span>v1.0.0-beta</span>
            <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               Online
            </span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
