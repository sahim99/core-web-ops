import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { useTheme } from '../../context/ThemeContext'
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  BuildingOfficeIcon,
  CreditCardIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'
import { MessageSquare } from 'lucide-react'
import { useChat } from '../../context/ChatContext'

function Topbar() {
  const { user, logout, isDemo } = useAuth()
  const { isOwner, isStaff } = useRole()
  const { setIsOpen: setChatOpen, unreadCount } = useChat()
  const { isDark, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header 
      className={`h-16 flex items-center justify-between px-6 border-b backdrop-blur-md sticky top-0 z-40 ${
        isDark
          ? 'border-[var(--border-subtle)]'
          : 'border-slate-200'
      }`}
      style={{ backgroundColor: isDark ? 'rgba(15, 15, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}
    >

      {/* Left: Clean empty space — brand is in sidebar */}
      <div className="flex items-center" />

      {/* Right Side */}
      <div className="flex items-center gap-5 relative" ref={dropdownRef}>
        
        {/* Chat Icon */}
        <button 
           onClick={() => setChatOpen(true)}
           className={`relative p-2 rounded-lg transition-colors ${
             isDark
               ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'
               : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
           }`}
           title="Team Chat"
        >
           <MessageSquare className="w-5 h-5" />
           {unreadCount > 0 && (
             <span className={`absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ${
               isDark ? 'ring-[#0f0f1a]' : 'ring-white'
             }`}>
               {unreadCount > 9 ? '9+' : unreadCount}
             </span>
           )}
        </button>

        {/* Profile Trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-9 h-9 rounded-full bg-gradient-to-tr ${isStaff ? 'from-slate-500 to-slate-600' : 'from-primary-500 to-indigo-500'} p-[1px] shadow-lg ${isStaff ? 'shadow-slate-500/20' : 'shadow-indigo-500/20'} transition-all hover:scale-105 active:scale-95 ${isOpen ? 'ring-2 ring-primary-500/50' : ''}`}
        >
          <div className={`h-full w-full rounded-full flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-[var(--bg-primary)]' : 'bg-white'
          }`}>
             {user?.avatar_url ? (
               <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
             ) : (
               <div className={`text-xs font-bold text-white ${isStaff ? 'bg-gradient-to-tr from-slate-600 to-slate-500' : 'bg-gradient-to-tr from-primary-600 to-indigo-600'} h-full w-full flex items-center justify-center`}>
                 {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
               </div>
             )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute top-12 right-0 w-72 border rounded-2xl shadow-2xl overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50 ${
            isDark
              ? 'bg-[var(--bg-secondary)] border-[var(--border-default)] shadow-black/50'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            
            {/* Section 1: Account Info */}
            <div className={`p-5 border-b ${
              isDark ? 'border-[var(--border-subtle)] bg-[var(--bg-glass)]' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-full ${isStaff ? 'bg-gradient-to-tr from-slate-500 to-slate-600' : 'bg-gradient-to-tr from-primary-500 to-indigo-500'} flex items-center justify-center text-sm font-bold text-white shadow-md`}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                   <h3 className={`text-sm font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{user?.full_name}</h3>
                   <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-[var(--bg-glass-hover)] text-text-secondary border-[var(--border-subtle)]'
                    : 'bg-slate-100 text-[var(--text-secondary)] border-slate-200'
                }`}>
                  {user?.workspace_id || 'Personal Workspace'}
                </span>
                {isDemo ? (
                  <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
                    Demo
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                    isOwner
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : isDark ? 'bg-slate-700/30 text-[var(--text-muted)] border-slate-700/50' : 'bg-slate-100 text-[var(--text-secondary)] border-slate-200'
                  }`}>
                    {isOwner ? 'Owner' : 'Staff'}
                  </span>
                )}
              </div>
              {/* Staff ID for staff users */}
              {isStaff && user?.staff_id && (
                <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${
                  isDark ? 'border-[var(--border-subtle)]' : 'border-slate-200'
                }`}>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>ID</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    isDark ? 'bg-[var(--bg-glass-hover)] text-[var(--text-muted)] border-[var(--border-subtle)]' : 'bg-slate-100 text-[var(--text-secondary)] border-slate-200'
                  }`}>
                    {user.staff_id}
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Settings */}
            <div className={`p-2 border-b ${isDark ? 'border-[var(--border-subtle)]' : 'border-slate-100'}`}>
               <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-[var(--text-muted)]'}`}>Settings</div>
               <Link to="/settings/account" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                 isDark ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]' : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
               }`}>
                  <UserCircleIcon className="w-4 h-4" />
                  Account Settings
               </Link>
               {isOwner && (
                 <>
                   <Link to="/settings/workspace" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                     isDark ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]' : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
                   }`}>
                      <BuildingOfficeIcon className="w-4 h-4" />
                      Workspace Settings
                   </Link>
                   <Link to="/settings/billing" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                     isDark ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]' : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
                   }`}>
                      <CreditCardIcon className="w-4 h-4" />
                      Billing & Plans
                   </Link>
                 </>
               )}
               <Link to="/settings/notifications" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                 isDark ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]' : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
               }`}>
                  <BellIcon className="w-4 h-4" />
                  Notifications
               </Link>
            </div>

            {/* Section 3: Theme & Logout */}
            <div className={`p-2 ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
              <button 
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDark
                    ? 'text-text-secondary hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'
                    : 'text-[var(--text-secondary)] hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                 <div className="flex items-center gap-3">
                   {isDark ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                   {isDark ? 'Dark Mode' : 'Light Mode'}
                 </div>
                 {/* Toggle Switch */}
                 <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${
                   isDark ? 'bg-indigo-600' : 'bg-amber-400'
                 }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                      isDark ? 'right-0.5' : 'left-0.5'
                    }`}></div>
                 </div>
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
              >
                 <ArrowRightOnRectangleIcon className="w-4 h-4" />
                 Sign Out
              </button>
            </div>

          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar
