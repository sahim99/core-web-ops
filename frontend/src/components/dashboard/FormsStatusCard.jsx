import { memo } from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

function FormsStatusCard({ data = {} }) {
  const active = data.active_forms || 0
  const subs = data.recent_submissions || 0

  return (
    <div className="flex items-center gap-3 h-full">
      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <DocumentTextIcon className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-[var(--text-primary)] tabular-nums leading-none">{active}</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Active Forms</span>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{subs} submissions this period</p>
      </div>
    </div>
  )
}

export default memo(FormsStatusCard)
