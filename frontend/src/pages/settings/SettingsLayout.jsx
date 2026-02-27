import { NavLink, Outlet } from 'react-router-dom'
import { 
  UserCircleIcon, 
  BuildingOfficeIcon, 
  CreditCardIcon, 
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Account', href: '/settings/account', icon: UserCircleIcon },
  { name: 'Workspace', href: '/settings/workspace', icon: BuildingOfficeIcon },
  { name: 'Billing', href: '/settings/billing', icon: CreditCardIcon },
  { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
]

function SettingsLayout() {
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] overflow-hidden font-sans">
      {/* Mobile Navigation (Horizontal Scroll) */}
      <div className="lg:hidden overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] sticky top-16 z-20">
        <nav className="flex p-4 gap-4 min-w-max">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b-2 border-transparent transition-colors duration-150"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </NavLink>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 border-b-2 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] pt-10 px-4 fixed h-full z-10 bottom-0 top-16">
        <nav className="flex flex-1 flex-col space-y-1">
          <NavLink
            to="/dashboard"
            className="group flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)] transition-colors duration-200 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 shrink-0 transition-colors group-hover:text-[var(--text-primary)]" />
            Back to Dashboard
          </NavLink>
          
          <div className="space-y-1">
             {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)] border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon
                  className="h-5 w-5 shrink-0 transition-colors"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-6 lg:pt-0 overflow-y-auto h-screen scrollbar-hide">
        <div className="px-12 py-10">
          <div className="max-w-5xl mx-auto space-y-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsLayout
