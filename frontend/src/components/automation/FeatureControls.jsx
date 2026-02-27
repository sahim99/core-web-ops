import { memo, useState } from 'react'
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathRoundedSquareIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { toggleFeature as apiToggleFeature } from '../../api/automation.api'

const FEATURE_ICONS = {
  customer_emails:        EnvelopeIcon,
  staff_sms_alerts:       DevicePhoneMobileIcon,
  auto_thread_creation:   ChatBubbleLeftRightIcon,
  failure_retry:          ArrowPathRoundedSquareIcon,
  execution_logging:      DocumentMagnifyingGlassIcon,
}

const CATEGORY_LABEL = {
  notifications: 'Notifications',
  workflow:      'Workflow',
  reliability:   'Reliability',
  observability: 'Observability',
}

/* ── Toggle Switch ─────────────────────────────────────────────── */
function Toggle({ enabled, onToggle, loading }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative shrink-0 w-10 h-[22px] rounded-full transition-all duration-300 ${
        enabled
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
          : 'bg-slate-700/50 hover:bg-slate-700'
      } ${loading ? 'opacity-40 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full shadow-md transition-all duration-300 ${
        enabled
          ? 'translate-x-[18px] bg-white'
          : 'bg-slate-400'
      }`} />
    </button>
  )
}

/* ── Single Feature Row ────────────────────────────────────────── */
const FeatureRow = memo(function FeatureRow({ feature, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const Icon = FEATURE_ICONS[feature.key] || EnvelopeIcon
  const enabled = feature.enabled !== false

  const handleToggle = async () => {
    setToggling(true)
    try {
      await apiToggleFeature(feature.key, !enabled)
      onToggle(feature.key, !enabled)
    } catch (e) {
      console.error('Feature toggle failed', e)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 border ${
      enabled
        ? 'bg-amber-500/[0.03] border-amber-500/[0.06] hover:border-amber-500/15'
        : 'bg-transparent border-transparent opacity-50 hover:opacity-70'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        enabled ? 'bg-amber-500/10' : 'bg-slate-800'
      }`}>
        <Icon className={`w-4 h-4 ${enabled ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold leading-tight ${enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
          {feature.label}
        </p>
        <p className="text-[9px] text-[var(--text-secondary)] mt-0.5 leading-tight truncate">{feature.description}</p>
      </div>
      <Toggle enabled={enabled} onToggle={handleToggle} loading={toggling} />
    </div>
  )
})

/* ── Main Component ────────────────────────────────────────────── */
function FeatureControls({ features = [], onFeatureToggle }) {
  if (!features.length) return null

  // Group by category
  const grouped = features.reduce((acc, f) => {
    const cat = f.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1.5 px-1">
            {CATEGORY_LABEL[cat] || cat}
          </p>
          <div className="space-y-1">
            {items.map((f) => (
              <FeatureRow key={f.key} feature={f} onToggle={onFeatureToggle} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(FeatureControls)
