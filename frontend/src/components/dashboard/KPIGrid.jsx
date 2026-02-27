import { memo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDaysIcon, UserGroupIcon, ClockIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

/* ── Animated Counter ─────────────────────────────────────────── */
function AnimatedNumber({ value = 0, duration = 700 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef()
  const from = useRef(0)

  useEffect(() => {
    const target = value
    const startVal = from.current
    from.current = target
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(startVal + (target - startVal) * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <span>{display.toLocaleString()}</span>
}

function GrowthBadge({ value }) {
  if (value === 0 || value == null) return null
  const up = value > 0
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
      up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
    }`}>
      {up ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  )
}

/* ── KPI Config ───────────────────────────────────────────────── */
const KPI_META = {
  total_bookings:   { label: 'Total Bookings',   icon: CalendarDaysIcon, accent: 'indigo' },
  total_contacts:   { label: 'Total Contacts',   icon: UserGroupIcon,   accent: 'blue' },
  pending_bookings: { label: 'Pending',           icon: ClockIcon,       accent: 'amber' },
  unread_alerts:    { label: 'Alerts',            icon: ExclamationTriangleIcon, accent: 'rose' },
}

const THEME = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', hover: 'hover:border-indigo-500/20' },
  blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   hover: 'hover:border-blue-500/20' },
  amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  hover: 'hover:border-amber-500/20' },
  rose:   { bg: 'bg-rose-500/10',   icon: 'text-rose-400',   hover: 'hover:border-rose-500/20' },
}

const KPICard = memo(function KPICard({ k, value, growth, onClick }) {
  const m = KPI_META[k]
  const t = THEME[m.accent]
  const Icon = m.icon
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -1 }}
      className={`bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)] rounded-2xl px-4 py-3 cursor-pointer transition-colors ${t.hover} flex items-center gap-3 group`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg}`}>
        <Icon className={`w-4 h-4 ${t.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums leading-none">
            <AnimatedNumber value={value} />
          </span>
          <GrowthBadge value={growth} />
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-widest mt-0.5 truncate">{m.label}</p>
      </div>
    </motion.div>
  )
})

/* ── Grid ─────────────────────────────────────────────────────── */
function KPIGrid({ kpis = {}, growth = {}, onNavigate }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard k="total_bookings"   value={kpis.total_bookings}   growth={growth.bookings} onClick={() => onNavigate('/bookings')} />
      <KPICard k="total_contacts"   value={kpis.total_contacts}   growth={growth.contacts} onClick={() => onNavigate('/contacts')} />
      <KPICard k="pending_bookings" value={kpis.pending_bookings} onClick={() => onNavigate('/bookings?status=pending')} />
      <KPICard k="unread_alerts"    value={kpis.unread_alerts}    onClick={() => onNavigate('/alerts')} />
    </div>
  )
}

export default memo(KPIGrid)
