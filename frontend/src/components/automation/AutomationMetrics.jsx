import { memo, useState, useEffect, useRef } from 'react'

/* ── Animated Counter ──────────────────────────────────────────── */
function AnimCounter({ value = 0, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = value
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <>{display}</>
}

/* ── Metric Card ───────────────────────────────────────────────── */
const MetricCard = memo(function MetricCard({ label, value, suffix = '', color = 'text-[var(--text-primary)]', accent = '', sub = null, highlight = false }) {
  return (
    <div className={`group relative px-4 py-3.5 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
      highlight
        ? `bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] border-amber-500/15 hover:border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.04)]`
        : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
    }`}>
      <dt className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em]">{label}</dt>
      <dd className={`mt-1.5 text-[26px] font-black tabular-nums tracking-tight leading-none ${color}`}>
        <AnimCounter value={value} /><span className="text-[18px] ml-0.5 opacity-60">{suffix}</span>
      </dd>
      {sub && <p className="text-[9px] text-[var(--text-secondary)] mt-1 font-mono">{sub}</p>}
    </div>
  )
})

/* ── Main Component ────────────────────────────────────────────── */
function AutomationMetrics({ status = {} }) {
  const {
    total_events = 0,
    success = 0,
    failures = 0,
    success_rate = 100,
    avg_latency_ms = 0,
    p95_latency_ms = 0,
    events_24h = 0,
    events_per_minute = 0,
  } = status

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <MetricCard
        label="Total Events"
        value={total_events}
        highlight
      />
      <MetricCard
        label="Success"
        value={success}
        color="text-emerald-400"
      />
      <MetricCard
        label="Failures"
        value={failures}
        color={failures > 0 ? 'text-rose-400' : 'text-[var(--text-secondary)]'}
      />
      <MetricCard
        label="Success Rate"
        value={success_rate}
        suffix="%"
        color={success_rate >= 95 ? 'text-emerald-400' : success_rate >= 80 ? 'text-amber-400' : 'text-rose-400'}
        highlight={success_rate >= 95}
      />
      <MetricCard
        label="Avg Latency"
        value={avg_latency_ms}
        suffix="ms"
        color="text-sky-400"
        sub={`P95: ${p95_latency_ms}ms`}
      />
      <MetricCard
        label="24h Volume"
        value={events_24h}
        color="text-violet-400"
        sub={`${events_per_minute} evt/min`}
      />
    </div>
  )
}

export default memo(AutomationMetrics)
