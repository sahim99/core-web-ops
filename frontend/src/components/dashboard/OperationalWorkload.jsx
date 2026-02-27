import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts'
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon, 
  CubeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

function OperationalWorkload({ stats }) {
  const navigate = useNavigate()

  const data = [
    {
      name: 'Inbox',
      value: stats?.unanswered_conversations || 0,
      color: '#6366f1', // Indigo-500
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
      path: '/inbox?filter=unread'
    },
    {
      name: 'Pending',
      value: stats?.pending_bookings || 0,
      color: '#f59e0b', // Amber-500
      icon: <CalendarDaysIcon className="w-4 h-4" />,
      path: '/bookings?status=pending'
    },
    {
      name: 'Forms',
      value: stats?.recent_forms || 0,
      color: '#3b82f6', // Blue-500
      icon: <DocumentTextIcon className="w-4 h-4" />,
      path: '/forms'
    },
    {
      name: 'Inventory',
      value: stats?.low_stock_items || 0,
      color: '#f43f5e', // Rose-500
      icon: <CubeIcon className="w-4 h-4" />,
      path: '/inventory?filter=low'
    }
  ]

  const totalPending = data.reduce((acc, item) => acc + item.value, 0)
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e1e2e] border border-[var(--border-default)] p-3 rounded-lg shadow-xl">
          <p className="text-[var(--text-primary)] font-bold text-sm mb-1">{label}</p>
          <p className="text-[var(--text-secondary)] text-xs">
            <span className="font-mono text-[var(--text-primary)] font-bold">{payload[0].value}</span> items pending
          </p>
        </div>
      )
    }
    return null
  }

  // Click handler for charts
  const handleClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
       const route = data.activePayload[0].payload.path;
       navigate(route);
    }
  }

  return (
    <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2 z-10 relative">
         <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            Operational Workload
         </h3>
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalPending > 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {totalPending} TASKS
         </span>
      </div>

      {totalPending === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
               <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">All Operations Clear</h4>
            <p className="text-[var(--text-secondary)] text-xs mt-2 max-w-xs mx-auto">
               No pending messages, bookings, or inventory alerts. You're all caught up!
            </p>
         </div>
      ) : (
         <div className="flex-1 min-h-0 w-full relative -ml-4">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                  data={data} 
                  layout="vertical" 
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  onClick={handleClick}
                  className="cursor-pointer"
               >
                  <XAxis type="number" hide />
                  <YAxis 
                     type="category" 
                     dataKey="name" 
                     tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                     axisLine={false}
                     tickLine={false}
                     width={60}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} minPointSize={2}>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
            
            {/* Quick Actions Overlay (optional, subtle) */}
            <div className="absolute bottom-0 right-0 p-4 pointer-events-none">
               <span className="text-[10px] text-[var(--text-secondary)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  Click bars to view details
               </span>
            </div>
         </div>
      )}
    </div>
  )
}

export default OperationalWorkload
