import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { getRules, getEngineStatus, getFeatures } from '../../api/automation.api'
import { getEventLogs } from '../../api/eventLogs.api'
import { getIntegrationHealth } from '../../api/integrations.api'

import AutomationMetrics from '../../components/automation/AutomationMetrics'
import EngineStatus from '../../components/automation/EngineStatus'
import ExecutionStream from '../../components/automation/AutomationLogs'
import TriggerPipeline from '../../components/automation/AutomationRules'
import IntegrationHealth from '../../components/automation/IntegrationHealth'
import FeatureControls from '../../components/automation/FeatureControls'

import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import {
  BoltIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  SignalIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

/* ── Section Wrapper ───────────────────────────────────────────── */
const Section = memo(function Section({ title, icon: Icon, action, children, className = '', amber = false }) {
  return (
    <div className={`rounded-xl border overflow-hidden ${
      amber
        ? 'bg-[var(--bg-secondary)] border-amber-500/[0.08]'
        : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
    } ${className}`}>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
        amber
          ? 'border-amber-500/[0.08] bg-amber-500/[0.02]'
          : 'border-[var(--border-subtle)] bg-[var(--border-subtle)]'
      }`}>
        <h3 className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] ${
          amber ? 'text-amber-500/50' : 'text-[var(--text-secondary)]'
        }`}>
          {Icon && <Icon className="w-3 h-3" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
})

/* ── Page Skeleton ─────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-12 bg-[var(--bg-glass)] rounded-xl w-1/2" />
      <div className="grid grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-[88px] bg-[var(--bg-glass)] rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-[450px] bg-[var(--bg-glass)] rounded-xl" />
        <div className="h-[450px] bg-[var(--bg-glass)] rounded-xl" />
      </div>
      <div className="h-64 bg-[var(--bg-glass)] rounded-xl" />
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────── */
export default function AutomationDashboard() {
  const [engineStatus, setEngineStatus] = useState(null)
  const [rules, setRules] = useState([])
  const [logs, setLogs] = useState([])
  const [health, setHealth] = useState(null)
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)

  const rulesLoaded = useRef(false)

  const loadAll = useCallback(async () => {
    try {
      const promises = [
        getEngineStatus(),
        getEventLogs({ source: 'automation', limit: 30 }),
        getIntegrationHealth(),
      ]
      if (!rulesLoaded.current) {
        promises.push(getRules())
        promises.push(getFeatures())
      }

      const results = await Promise.all(promises)
      setEngineStatus(results[0])
      setLogs(results[1])
      setHealth(results[2])

      if (!rulesLoaded.current && results[3]) {
        setRules(results[3])
        setFeatures(results[4] || [])
        rulesLoaded.current = true
      }
    } catch (err) {
      console.error('Automation data fetch failed', err)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
    const interval = setInterval(loadAll, 60000)
    return () => clearInterval(interval)
  }, [loadAll])

  const handleRefresh = async () => {
    setLoading(true)
    rulesLoaded.current = false
    await loadAll()
    setLoading(false)
  }

  const handleRuleToggle = useCallback((key, enabled) => {
    setRules(prev => prev.map(r => r.key === key ? { ...r, enabled } : r))
  }, [])

  const handleFeatureToggle = useCallback((key, enabled) => {
    setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled } : f))
  }, [])

  if (loading && !engineStatus) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <PageSkeleton />
          </main>
        </div>
      </div>
    )
  }

  const enabledRules = rules.filter(r => r.enabled !== false).length
  const totalRules = rules.length

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">

            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                    <BoltIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  Automation Engine
                </h1>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-mono leading-relaxed max-w-xl">
                  Processing <span className="text-amber-400/80 font-bold">{engineStatus?.triggers || 0} triggers</span> across{' '}
                  <span className="text-amber-400/80 font-bold">{engineStatus?.integrations || 0} integrations</span>{' '}
                  · <span className="text-[var(--text-muted)]">{enabledRules}/{totalRules} rules active</span>
                  {engineStatus?.events_24h > 0 && (
                    <>
                      {' '}· <span className="text-[var(--text-muted)]">{engineStatus.events_24h} events in 24h</span>
                      {' '}· <span className="text-[var(--text-muted)]">{engineStatus.avg_latency_ms}ms avg</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <EngineStatus status={engineStatus || {}} />
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 rounded-lg bg-amber-500/[0.06] hover:bg-amber-500/10 text-amber-500/40 hover:text-amber-400 transition-all border border-amber-500/10 hover:border-amber-500/20 disabled:opacity-30"
                  title="Refresh"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* ── Row 1: Metrics ──────────────────────────────── */}
            <AutomationMetrics status={engineStatus || {}} />

            {/* ── Row 2: Stream + Controls ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Left: Execution Stream (2/3) */}
              <div className="lg:col-span-2">
                <Section
                  title="Execution Stream"
                  icon={DocumentTextIcon}
                  className="h-full"
                  action={
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-[var(--text-secondary)]">{logs.length} events</span>
                      <button
                        onClick={handleRefresh}
                        className="text-[9px] text-amber-400/60 hover:text-amber-300 transition-colors font-black uppercase tracking-wider"
                      >
                        Refresh
                      </button>
                    </div>
                  }
                >
                  <ExecutionStream logs={logs} loading={loading && !logs.length} />
                </Section>
              </div>

              {/* Right: Controls + Integrations (1/3) */}
              <div className="space-y-4">
                <Section title="Engine Controls" icon={AdjustmentsHorizontalIcon} amber>
                  <FeatureControls features={features} onFeatureToggle={handleFeatureToggle} />
                </Section>

                <Section title="Integrations" icon={SignalIcon}>
                  <IntegrationHealth health={health} />
                </Section>
              </div>
            </div>

            {/* ── Row 3: Event Triggers ───────────────────────── */}
            <Section title="Event Triggers" icon={BoltIcon} amber>
              <TriggerPipeline rules={rules} onRuleToggle={handleRuleToggle} />
            </Section>

          </div>
        </main>
      </div>
    </div>
  )
}
