import { memo, useState } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'

const STATUS_THEME = {
  success: { icon: CheckCircleIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'SUCCESS' },
  error:   { icon: XCircleIcon,     color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    label: 'FAILED' },
  failed:  { icon: XCircleIcon,     color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    label: 'FAILED' },
  info:    { icon: ExclamationTriangleIcon, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-glass-hover)]', border: 'border-[var(--border-default)]', label: 'INFO' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

function extractRuleKey(source) {
  if (!source) return 'unknown'
  return source.replace('automation.', '')
}

/* ── Single Execution Item ─────────────────────────────────────── */
const ExecutionItem = memo(function ExecutionItem({ log }) {
  const [expanded, setExpanded] = useState(false)
  const theme = STATUS_THEME[log.status] || STATUS_THEME.info
  const Icon = theme.icon
  const ruleKey = extractRuleKey(log.source)

  return (
    <div
      className={`rounded-lg border ${theme.border} ${theme.bg} transition-all duration-150 hover:border-[var(--border-default)]`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 ${theme.color}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">{ruleKey}</span>
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${theme.bg} ${theme.color} border ${theme.border}`}>
              {theme.label}
            </span>
          </div>
          {log.result && (
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">{log.result}</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {log.execution_ms != null && (
            <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-glass-hover)] px-1.5 py-0.5 rounded">
              {log.execution_ms}ms
            </span>
          )}
          <span className="text-[9px] text-[var(--text-secondary)]">{timeAgo(log.created_at)}</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-subtle)]">
            {/* Action summary */}
            {(log.action_count != null) && (
              <div className="flex gap-4 mb-2 text-[10px]">
                <span className="text-[var(--text-secondary)]">Actions: <strong className="text-[var(--text-primary)]">{log.action_count}</strong></span>
                {log.failed_action_count > 0 && (
                  <span className="text-rose-400">Failed: <strong>{log.failed_action_count}</strong></span>
                )}
              </div>
            )}
            {/* Payload */}
            <p className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Payload</p>
            <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
})

/* ── Main Stream ───────────────────────────────────────────────── */
function ExecutionStream({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-[var(--bg-glass)] animate-pulse border border-[var(--border-subtle)]" />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-glass-hover)] flex items-center justify-center mb-3">
          <CheckCircleIcon className="w-5 h-5 opacity-30" />
        </div>
        <p className="text-xs font-medium">No execution activity</p>
        <p className="text-[10px] mt-1 opacity-50">Events will appear here when automations fire</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
      {logs.map((log) => (
        <ExecutionItem key={log.id} log={log} />
      ))}
    </div>
  )
}

export default memo(ExecutionStream)
