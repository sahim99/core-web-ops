import { memo, useState } from 'react'
import {
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  BellAlertIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'
import { toggleRule as apiToggleRule } from '../../api/automation.api'

/* ── Action icon + label map ───────────────────────────────────── */
const ACTION_ICON = {
  send_email:           { icon: EnvelopeIcon,           label: 'Email' },
  send_sms:             { icon: DevicePhoneMobileIcon,  label: 'SMS' },
  create_alert:         { icon: BellAlertIcon,          label: 'Alert' },
  create_conversation:  { icon: ChatBubbleLeftIcon,     label: 'Thread' },
}

const RULE_ACTIONS = {
  booking_confirmation: ['send_email', 'create_conversation'],
  new_contact_welcome:  ['send_email'],
  booking_cancellation: ['send_email', 'create_conversation'],
  form_notification:    ['send_email', 'create_conversation'],
  inventory_low_alert:  ['create_alert', 'send_sms'],
}

function timeAgo(dateStr) {
  if (!dateStr) return 'never'
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

/* ── Toggle Switch ─────────────────────────────────────────────── */
function ToggleSwitch({ enabled, onToggle, loading }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative shrink-0 w-9 h-5 rounded-full transition-all duration-200 ${
        enabled
          ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
          : 'bg-white/10'
      } ${loading ? 'opacity-50' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
        enabled ? 'translate-x-4' : ''
      }`} />
    </button>
  )
}

/* ── Single Pipeline Row ───────────────────────────────────────── */
const PipelineRow = memo(function PipelineRow({ rule, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const actions = RULE_ACTIONS[rule.key] || []
  const enabled = rule.enabled !== false

  const handleToggle = async () => {
    setToggling(true)
    try {
      await apiToggleRule(rule.key, !enabled)
      onToggle(rule.key, !enabled)
    } catch (e) {
      console.error('Toggle failed', e)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      enabled
        ? 'hover:bg-amber-500/[0.03] border border-transparent hover:border-amber-500/10'
        : 'opacity-40 border border-transparent'
    }`}>
      {/* Toggle */}
      <ToggleSwitch enabled={enabled} onToggle={handleToggle} loading={toggling} />

      {/* Trigger */}
      <div className="shrink-0 min-w-[140px]">
        <span className={`text-[11px] font-mono font-bold truncate ${
          enabled ? 'text-amber-300' : 'text-[var(--text-secondary)] line-through'
        }`}>{rule.trigger}</span>
      </div>

      {/* Arrow */}
      <div className={`text-xs select-none ${enabled ? 'text-amber-800' : 'text-slate-800'}`}>→</div>

      {/* Actions flow */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {actions.map((actionKey, i) => {
          const act = ACTION_ICON[actionKey] || { icon: BellAlertIcon, label: actionKey }
          const Icon = act.icon
          return (
            <div key={actionKey} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-amber-900/50 text-[10px] select-none">→</span>}
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border ${
                enabled
                  ? 'bg-amber-500/[0.06] border-amber-500/10'
                  : 'bg-[var(--bg-glass)] border-[var(--border-subtle)]'
              }`}>
                <Icon className={`w-3 h-3 ${enabled ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
                <span className={`font-medium ${enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{act.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rule metrics */}
      <div className="shrink-0 flex items-center gap-3 text-[9px] font-mono text-[var(--text-secondary)]">
        {rule.exec_count_24h > 0 ? (
          <>
            <span>{rule.exec_count_24h}x/24h</span>
            <span className={rule.success_rate_24h >= 95 ? 'text-emerald-500' : 'text-amber-500'}>
              {rule.success_rate_24h}%
            </span>
            <span>{timeAgo(rule.last_triggered)}</span>
          </>
        ) : (
          <span className="text-slate-700">no activity</span>
        )}
      </div>
    </div>
  )
})

/* ── Main Component ────────────────────────────────────────────── */
function TriggerPipeline({ rules = [], onRuleToggle }) {
  if (!rules.length) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
        No automation rules configured.
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.03]">
      {rules.map((rule) => (
        <PipelineRow key={rule.key} rule={rule} onToggle={onRuleToggle} />
      ))}
    </div>
  )
}

export default memo(TriggerPipeline)
