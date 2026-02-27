import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'

const STYLES = {
  critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', Icon: ExclamationCircleIcon, pulse: true },
  warning:  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', Icon: ExclamationTriangleIcon, pulse: false },
  info:     { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', Icon: InformationCircleIcon, pulse: false },
}

function AlertStrip({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="flex items-center gap-2 h-full overflow-x-auto scrollbar-hide">
      <AnimatePresence>
        {alerts.slice(0, 4).map((a, i) => {
          const s = STYLES[a.severity] || STYLES.info
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.06 }}
              className={`flex-1 min-w-[180px] flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.bg} ${s.border} cursor-pointer hover:bg-[var(--bg-glass)] transition-colors`}
            >
              <div className="relative shrink-0">
                <s.Icon className={`w-3.5 h-3.5 ${s.text}`} />
                {s.pulse && !a.is_read && (
                  <span className="absolute inset-0 rounded-full bg-rose-500 opacity-30 animate-ping" />
                )}
              </div>
              <span className={`text-[10px] font-bold truncate ${s.text}`}>{a.title}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {alerts.length > 4 && (
        <div className="shrink-0 px-2 py-1 text-[9px] text-[var(--text-secondary)] font-bold whitespace-nowrap">
          +{alerts.length - 4}
        </div>
      )}
    </div>
  )
}

export default memo(AlertStrip)
