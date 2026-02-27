import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

export default function StepEmail() {
  const navigate = useNavigate()
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
           <span className="text-2xl">📧</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Connect Email</h2>
          <p className="text-[var(--text-muted)] text-sm">Sync your team's communications</p>
        </div>
      </div>

      <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
        Email integration allows specific team members to sync their inboxes directly with the platform. 
        You can configure advanced routing rules and signatures in settings later.
      </p>

      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-8 flex items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-[var(--text-primary)]" strokeWidth={3} />
        </div>
        <div>
          <p className="text-emerald-400 font-medium">Default service ready</p>
          <p className="text-emerald-500/60 text-xs">System email is active</p>
        </div>
      </div>

      <button 
        onClick={() => navigate('/onboarding/contacts')} 
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
      >
        Continue to Contacts
      </button>
    </div>
  )
}
