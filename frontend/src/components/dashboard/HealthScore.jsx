import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

const R = 36
const C = 2 * Math.PI * R

const S = {
  excellent: { color: '#10b981', label: 'Excellent', cls: 'text-emerald-400' },
  good:      { color: '#6366f1', label: 'Good',      cls: 'text-indigo-400' },
  warning:   { color: '#f59e0b', label: 'Warning',   cls: 'text-amber-400' },
  critical:  { color: '#ef4444', label: 'Critical',  cls: 'text-rose-400' },
}

function HealthScore({ score = 0, status = 'good', details = {}, inventoryData = {} }) {
  const s = S[status] || S.good
  const offset = useMemo(() => C - (score / 100) * C, [score])

  const totalItems = inventoryData.total_items || 0
  const lowStock = inventoryData.low_stock || details.low_stock_items || 0
  const outOfStock = inventoryData.out_of_stock || 0
  const criticalAlerts = details.critical_alerts || 0
  const allGood = !criticalAlerts && !lowStock && !outOfStock

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center gap-4">
      {/* Gauge */}
      <div className="relative shrink-0">
        <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
          <circle cx="42" cy="42" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <motion.circle
            cx="42" cy="42" r={R} fill="none"
            stroke={s.color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${s.color}44)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-black tabular-nums leading-none ${s.cls}`}>{score}</span>
          <span className="text-[7px] text-[var(--text-secondary)] mt-px">/ 100</span>
        </div>
      </div>
      {/* Label + Inventory Details */}
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-bold ${s.cls}`}>{s.label}</span>
        {criticalAlerts > 0 && (
          <span className="text-[9px] text-rose-400">⚠ {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''}</span>
        )}
        {lowStock > 0 && (
          <span className="text-[9px] text-amber-400">⚠ {lowStock} low stock</span>
        )}
        {outOfStock > 0 && (
          <span className="text-[9px] text-rose-400">✕ {outOfStock} out of stock</span>
        )}
        {totalItems > 0 && (
          <span className={`text-[9px] ${allGood ? 'text-emerald-400/60' : 'text-[var(--text-secondary)]'}`}>
            📦 {totalItems} item{totalItems > 1 ? 's' : ''} tracked
          </span>
        )}
        {allGood && (
          <span className="text-[9px] text-emerald-400/60">✓ All systems healthy</span>
        )}
      </div>
    </div>
  )
}

export default memo(HealthScore)

