import { memo } from 'react'
import { InboxStackIcon } from '@heroicons/react/24/outline'

function InboxHealthCard({ data = {} }) {
  const unanswered = data.unanswered || 0
  const active = data.active_conversations || 0
  const ok = unanswered === 0

  return (
    <div className="flex items-center gap-3 h-full">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
        <InboxStackIcon className={`w-4 h-4 ${ok ? 'text-emerald-400' : 'text-blue-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-[var(--text-primary)] tabular-nums leading-none">{unanswered}</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Unanswered</span>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{active} active threads</p>
      </div>
    </div>
  )
}

export default memo(InboxHealthCard)
