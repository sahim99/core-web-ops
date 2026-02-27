import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Check, X, Rocket, ShieldCheck } from 'lucide-react'
import api from "../../api/axios";
import { useAuth } from '../../context/AuthContext'

export default function StepActivate() {
  const navigate = useNavigate()
  const { status, refreshStatus } = useOutletContext()
  const { refreshUser } = useAuth() 
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Computed checks
  const checks = [
    { label: 'Email Configured', valid: status?.steps_completed?.email_configured },
    { label: 'Booking Service Created', valid: status?.steps_completed?.booking_configured },
    { label: 'Form Created', valid: status?.steps_completed?.forms_configured },
    { label: 'Inventory Initialized', valid: status?.steps_completed?.inventory_configured },
  ]
  
  const allValid = checks.every(c => c.valid)

  const handleActivate = async () => {
    setLoading(true)
    setError(null)
    try {
      await api.post('/onboarding/activate')
      await refreshStatus() // Updates local status
      // Redirect to dashboard
      window.location.href = '/dashboard' // Full reload to ensure context updates
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail?.message || "Activation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
           <ShieldCheck className="h-6 w-6 text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Review & Activate</h2>
          <p className="text-[var(--text-muted)] text-sm">System pre-flight check</p>
        </div>
      </div>

      <div className="bg-slate-950/50 rounded-xl p-6 mb-8 border border-slate-800">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Configuration Status</h3>
        <ul className="space-y-3">
          {checks.map((check, idx) => (
            <li key={idx} className="flex items-center justify-between group">
              <span className="text-[var(--text-secondary)] font-medium group-hover:text-[var(--text-primary)] transition-colors">{check.label}</span>
              {check.valid ? (
                 <span className="flex items-center text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} /> Ready
                 </span>
              ) : (
                 <span className="flex items-center text-rose-400 text-xs font-bold bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                    <X className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} /> Missing
                 </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      <button 
        onClick={handleActivate}
        disabled={!allValid || loading}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg
          ${allValid && !loading 
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-[var(--text-primary)] shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1' 
            : 'bg-slate-800 text-[var(--text-secondary)] cursor-not-allowed border border-slate-700'}`}
      >
        {loading ? (
            <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching...
            </span>
        ) : (
            <>
                <Rocket className="w-5 h-5 mr-2 animate-pulse" />
                Launch Workspace
            </>
        )}
      </button>
    </div>
  )
}
