import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { getOwnerOverview } from '../../api/dashboard.api'
import { DASHBOARD_CONFIG } from '../../config/dashboard.config'
import { DEMO_DATA } from '../../config/demoData'

// Widgets
import RevenueChart from '../../components/dashboard/RevenueChart'
import BookingsChart from '../../components/dashboard/BookingsChart'
import PipelineFunnel from '../../components/dashboard/PipelineFunnel'
import InventoryListWidget from '../../components/dashboard/InventoryListWidget'
import KPIGrid from '../../components/dashboard/KPIGrid'
import AlertStrip from '../../components/dashboard/AlertStrip'
import FormsStatusCard from '../../components/dashboard/FormsStatusCard'
import InventoryStatusCard from '../../components/dashboard/InventoryStatusCard'
import InboxHealthCard from '../../components/dashboard/InboxHealthCard'
import DemoBanner from '../../components/layout/DemoBanner'

import { BoltIcon } from '@heroicons/react/24/outline'

/* ─── Range Toggle ──────────────────────────────────────────── */
const RANGES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
]
const RangeToggle = memo(function RangeToggle({ active, onChange }) {
  return (
    <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-0.5 gap-0.5">
      {RANGES.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`relative px-3 py-1 text-[11px] font-bold tracking-widest rounded-md transition-all duration-200 ${
            active === r.value ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {active === r.value && (
            <motion.span
              layoutId="range-pill"
              className="absolute inset-0 bg-indigo-600/30 border border-indigo-500/30 rounded-md"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{r.label}</span>
        </button>
      ))}
    </div>
  )
})

/* ─── Section Card (Reusable Panel) ──────────────────────────── */
const SectionCard = memo(function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)] rounded-2xl flex flex-col overflow-hidden ${className}`}>
      {title && (
        <div className="px-3.5 py-2 shrink-0 border-b border-[var(--border-subtle)]">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">{title}</h3>
          {subtitle && <p className="text-[8px] text-[var(--text-secondary)] mt-px">{subtitle}</p>}
        </div>
      )}
      <div className="flex-1 min-h-0 p-2.5 flex flex-col">
        {children}
      </div>
    </div>
  )
})

/* ─── Compact Bottom Card ────────────────────────────────────── */
const BottomCard = memo(function BottomCard({ children }) {
  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)] rounded-xl px-4 py-3 flex items-center">
      {children}
    </div>
  )
})

/* ─── Skeleton Loader ────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 min-h-0 p-5 animate-pulse flex flex-col gap-3">
          <div className="h-7 w-56 bg-[var(--bg-glass-hover)] rounded-lg" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--bg-glass-hover)] rounded-2xl" />)}
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-[var(--bg-glass-hover)] rounded-2xl" />
              <div className="flex-1 bg-[var(--bg-glass-hover)] rounded-2xl" />
            </div>
            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-[var(--bg-glass-hover)] rounded-2xl" />
              <div className="flex-1 bg-[var(--bg-glass-hover)] rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-[var(--bg-glass-hover)] rounded-xl" />)}
          </div>
        </main>
      </div>
    </div>
  )
}

function AccessDenied() {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 bg-[var(--bg-glass-hover)] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Owner Access Required</h3>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Dashboard analytics are restricted to workspace owners.</p>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Animation Variants ─────────────────────────────────────── */
const STAGGER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const FADE_UP = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function Dashboard() {
  const { isOwner } = useRole()
  const { isDemo } = useAuth()
  const navigate = useNavigate()
  const w = DASHBOARD_CONFIG.widgets

  const [range, setRange] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (r) => {
    // In demo mode, skip the API and use pre-seeded fake data
    if (isDemo) {
      setData(DEMO_DATA)
      setLoading(false)
      return
    }
    try {
      const res = await getOwnerOverview(r)
      setData(res.data)
    } catch (err) {
      console.error('Dashboard fetch failed', err)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    if (!isOwner) { setLoading(false); return }
    fetchData(range)
    const id = setInterval(() => fetchData(range), DASHBOARD_CONFIG.autoRefreshInterval)
    return () => clearInterval(id)
  }, [isOwner, range, fetchData])

  if (!isOwner) return <AccessDenied />
  if (loading) return <DashboardSkeleton />

  const {
    kpis = {}, growth = {}, pipeline = {}, alerts = [], health = {},
    revenue_trend = [], booking_status = {},
    forms_status = {}, inventory_status = {}, inbox_status = {},
  } = data || {}

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        {/* ── MAIN CONTENT AREA ────────────────────────────── */}
        <main className="flex-1 min-h-0 overflow-hidden p-3 lg:p-4 flex flex-col">
          <motion.div
            variants={STAGGER}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 h-full min-h-0 w-full max-w-[1600px] mx-auto"
          >

            {/* ROW 0 — Demo Banner (only in demo mode) ─────── */}
            {isDemo && (
              <motion.div variants={FADE_UP} className="flex-none">
                <DemoBanner />
              </motion.div>
            )}

            {/* ROW 1 — Header ──────────────────────────────── */}
            <motion.div variants={FADE_UP} className="flex-none flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-indigo-400" />
                <h1 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Command Center</h1>
                <span className="text-[var(--text-secondary)] font-mono text-[11px] ml-1 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <RangeToggle active={range} onChange={(r) => { setRange(r); fetchData(r) }} />
                {DASHBOARD_CONFIG.showLiveIndicator && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md border border-[var(--border-subtle)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">Live</span>
                  </div>
                )}
              </div>
            </motion.div>




            {/* ROW 3 — KPI Cards ───────────────────────────── */}
            {w.kpiGrid && (
              <motion.div variants={FADE_UP} className="flex-none">
                <KPIGrid kpis={kpis} growth={growth} onNavigate={navigate} />
              </motion.div>
            )}

            {/* ROW 4 — Main Analytics (flex-1, takes ALL remaining space) */}
            <motion.div variants={FADE_UP} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3">

              {/* LEFT 2/3 — Charts */}
              <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                {w.revenueChart && (
                  <SectionCard title="Revenue & Activity" subtitle={`Last ${range} days`} className="flex-1 min-h-0">
                    <RevenueChart data={revenue_trend} rangeDays={range} />
                  </SectionCard>
                )}
                {w.bookingTrend && (
                  <SectionCard title="Booking Distribution" subtitle="Status breakdown" className="flex-1 min-h-0">
                    <BookingsChart data={booking_status} />
                  </SectionCard>
                )}
              </div>

              {/* RIGHT 1/3 — Funnel + Health */}
              <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
                {w.pipelineFunnel && (
                  <SectionCard title="Conversion Funnel" subtitle="Contact → Booked" className="flex-[1.1] min-h-0">
                    <PipelineFunnel data={pipeline} rangeDays={range} />
                  </SectionCard>
                )}
                {w.healthScore && (
                  <SectionCard title="Inventory" subtitle={`${inventory_status.total_items || 0} items tracked`} className="flex-1 min-h-0">
                    <InventoryListWidget items={inventory_status.items || []} />
                  </SectionCard>
                )}
              </div>

            </motion.div>

            {/* ROW 5 — Bottom Status Strip (compact, fixed) ── */}
            <motion.div variants={FADE_UP} className="flex-none grid grid-cols-1 lg:grid-cols-3 gap-3">
              {w.formsStatus && (
                <BottomCard><FormsStatusCard data={forms_status} /></BottomCard>
              )}
              {w.inventoryStatus && (
                <BottomCard><InventoryStatusCard data={inventory_status} /></BottomCard>
              )}
              {w.inboxHealth && (
                <BottomCard><InboxHealthCard data={inbox_status} /></BottomCard>
              )}
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
