import React from 'react'

export const KPICard = ({ label, value, trend, icon, subtext, color = 'indigo', onClick }) => {
  const colorStyles = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  }

  const style = colorStyles[color] || colorStyles.indigo

  return (
    <div 
      onClick={onClick}
      className="group bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] hover:border-[var(--border-default)] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} transition-colors group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        {trend && (
           <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
             {trend > 0 ? '+' : ''}{trend}%
           </span>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-1">{value}</h3>
        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{label}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">{subtext}</p>
      </div>
    </div>
  )
}

export default KPICard
