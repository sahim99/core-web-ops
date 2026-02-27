import { memo, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(dateStr, rangeDays) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (rangeDays <= 7) return DAY_LABELS[d.getDay()]
    return `${MON_LABELS[d.getMonth()]} ${d.getDate()}`
  } catch {
    return dateStr
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload || {}
  return (
    <div className="bg-[#0d0d1c] border border-[var(--border-default)] rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-[var(--text-muted)] mb-2 font-mono">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          <span className="text-[var(--text-secondary)]">Bookings</span>
          <span className="ml-auto text-[var(--text-primary)] font-bold">{d.bookings ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[var(--text-secondary)]">Confirmed</span>
          <span className="ml-auto text-[var(--text-primary)] font-bold">{d.confirmed ?? 0}</span>
        </div>
      </div>
    </div>
  )
}

function RevenueChart({ data = [], rangeDays = 7 }) {
  const formatted = useMemo(() =>
    data.map(d => ({
      ...d,
      label: fmtDate(d.date, rangeDays)
    })), [data, rangeDays])

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#334155', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
          <Area
            type="monotoneX"
            dataKey="bookings"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradBookings)"
            dot={false}
            activeDot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
          />
          <Area
            type="monotoneX"
            dataKey="confirmed"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradConfirmed)"
            dot={false}
            activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default memo(RevenueChart)
