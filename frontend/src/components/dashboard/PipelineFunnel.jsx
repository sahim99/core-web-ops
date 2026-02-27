import { memo } from 'react'
import { motion } from 'framer-motion'

const STAGES = [
  { key: 'total_contacts',     label: 'Contacts',  color: 'bg-slate-500' },
  { key: 'new_contacts',       label: 'New',       color: 'bg-indigo-500' },
  { key: 'confirmed_bookings', label: 'Booked',    color: 'bg-emerald-500' },
]

function PipelineFunnel({ data = {} }) {
  const max = data.total_contacts || 1

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between">
      {/* Stages */}
      <div className="flex flex-col gap-3">
        {STAGES.map((s, i) => {
          const val = data[s.key] ?? 0
          const pct = max > 0 ? Math.round((val / max) * 100) : 0
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--text-muted)]">{s.label}</span>
                <span className="text-xs text-[var(--text-primary)] font-bold tabular-nums">{val}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${s.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Rate */}
      <div className="flex items-baseline justify-between pt-2 border-t border-[var(--border-subtle)] mt-auto">
        <span className="text-[10px] text-[var(--text-secondary)]">Rate</span>
        <span className={`text-lg font-black tabular-nums ${
          (data.conversion_rate || 0) >= 20 ? 'text-emerald-400' :
          (data.conversion_rate || 0) >= 10 ? 'text-amber-400' : 'text-rose-400'
        }`}>{(data.conversion_rate || 0).toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default memo(PipelineFunnel)
