import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const STATUS_THEME = {
  healthy:      { icon: CheckCircleIcon,           cls: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Healthy' },
  low_stock:    { icon: ExclamationTriangleIcon,   cls: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Low' },
  out_of_stock: { icon: XCircleIcon,               cls: 'text-rose-400',    bg: 'bg-rose-500/10',    label: 'Out' },
}

function InventoryListWidget({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-[var(--text-secondary)]">
        <CubeIcon className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-wider">No inventory items</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1 pb-1.5 shrink-0">
        <span>Item</span>
        <span>Stock</span>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-0.5 space-y-1">
        {items.map((item, i) => {
          const st = STATUS_THEME[item.status] || STATUS_THEME.healthy
          const Icon = st.icon
          const pct = item.threshold > 0
            ? Math.min(Math.round((item.quantity / item.threshold) * 100), 100)
            : 100

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-glass)] hover:bg-[var(--border-subtle)] border border-transparent hover:border-[var(--border-subtle)] transition-all group"
            >
              {/* Icon */}
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${st.bg}`}>
                <Icon className={`w-3 h-3 ${st.cls}`} />
              </div>

              {/* Name & Unit */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight">{item.name}</p>
                {item.sku && (
                  <p className="text-[8px] text-[var(--text-secondary)] font-mono truncate">{item.sku}</p>
                )}
              </div>

              {/* Stock Level */}
              <div className="text-right shrink-0 flex items-center gap-1.5">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-black text-[var(--text-primary)] tabular-nums">{Math.round(item.quantity)}</span>
                  {item.unit && (
                    <span className="text-[7px] text-[var(--text-secondary)] uppercase">{item.unit}</span>
                  )}
                </div>
                {/* Mini progress bar */}
                <div className="w-8 h-1 rounded-full bg-[var(--bg-glass-hover)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.status === 'out_of_stock' ? 'bg-rose-500'
                      : item.status === 'low_stock' ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(InventoryListWidget)
