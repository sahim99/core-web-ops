import { memo } from 'react'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'

function InventoryStatusCard({ data = {} }) {
  const total = data.total_items || 0
  const low = data.low_stock || 0
  const out = data.out_of_stock || 0
  const hasIssue = low > 0 || out > 0

  return (
    <div className="flex items-center gap-3 h-full">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${hasIssue ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
        <ArchiveBoxIcon className={`w-4 h-4 ${hasIssue ? 'text-amber-400' : 'text-emerald-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-[var(--text-primary)] tabular-nums leading-none">{total}</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Items</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {low > 0 && <span className="text-[10px] text-amber-400 font-medium">{low} low stock</span>}
          {out > 0 && <span className="text-[10px] text-rose-400 font-medium">{out} out</span>}
          {!hasIssue && <span className="text-[10px] text-emerald-400 font-medium">All stocked</span>}
        </div>
      </div>
    </div>
  )
}

export default memo(InventoryStatusCard)
