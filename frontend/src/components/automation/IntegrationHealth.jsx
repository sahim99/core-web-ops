import { memo } from 'react'
import { EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

const PROVIDER_ICON = {
  email: EnvelopeIcon,
  sms: DevicePhoneMobileIcon,
}

function timeAgo(dateStr) {
  if (!dateStr) return 'unknown'
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

function IntegrationHealth({ health }) {
  if (!health) return null

  const items = [
    { key: 'email', label: 'Email Provider' },
    { key: 'sms',   label: 'SMS Provider' },
  ]

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const data = health[item.key]
        if (!data) return null
        const Icon = PROVIDER_ICON[item.key] || EnvelopeIcon
        const healthy = data.healthy

        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
              healthy
                ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20'
                : 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20'
            }`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
              healthy ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}>
              <Icon className={`w-4 h-4 ${healthy ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  healthy
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {healthy ? 'Healthy' : 'Down'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-[var(--text-secondary)]">
                <span>{data.provider || 'Unknown'}</span>
                <span className="text-[var(--text-primary)]/10">│</span>
                <span>{data.latency_ms != null ? `${data.latency_ms}ms` : '—'}</span>
                <span className="text-[var(--text-primary)]/10">│</span>
                <span>{timeAgo(data.last_check)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default memo(IntegrationHealth)
