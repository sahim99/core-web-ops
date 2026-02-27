import { memo, useMemo } from 'react'

const STATE_CONFIG = {
  running:  { label: 'ENGINE RUNNING', dot: 'bg-emerald-400', text: 'text-emerald-300', border: 'border-emerald-500/15', bg: 'bg-emerald-500/[0.04]' },
  degraded: { label: 'DEGRADED',       dot: 'bg-amber-400',   text: 'text-amber-300',   border: 'border-amber-500/15',   bg: 'bg-amber-500/[0.04]' },
  error:    { label: 'ENGINE ERROR',   dot: 'bg-rose-400',    text: 'text-rose-300',    border: 'border-rose-500/15',    bg: 'bg-rose-500/[0.04]' },
  paused:   { label: 'PAUSED',         dot: 'bg-slate-600',   text: 'text-[var(--text-muted)]',   border: 'border-[var(--border-subtle)]',        bg: 'bg-[var(--bg-glass)]' },
}

function EngineStatus({ status = {} }) {
  const s = STATE_CONFIG[status.state] || STATE_CONFIG.running

  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.border} ${s.bg}`}>
        <span className="relative flex h-2 w-2">
          {status.state === 'running' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
        </span>
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${s.text}`}>
          {s.label}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="hidden md:flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-mono">
        <span className="text-[var(--text-secondary)]">{status.events_per_minute || 0} <span className="text-slate-700">evt/min</span></span>
        <span className="text-[var(--text-primary)]/[0.06]">│</span>
        <span className="text-[var(--text-secondary)]">{status.triggers || 0} <span className="text-slate-700">triggers</span></span>
        <span className="text-[var(--text-primary)]/[0.06]">│</span>
        <span className="text-[var(--text-secondary)]">{status.integrations || 0} <span className="text-slate-700">integrations</span></span>
      </div>
    </div>
  )
}

export default memo(EngineStatus)
