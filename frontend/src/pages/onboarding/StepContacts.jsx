import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Contact, ArrowRight, SkipForward, User, Mail, Phone, FileText } from 'lucide-react'
import api from "../../api/axios";

export default function StepContacts() {
  const navigate = useNavigate()
  const { refreshStatus } = useOutletContext()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return
    
    setLoading(true)
    try {
      await api.post('/contacts', {
        ...form,
        source: 'onboarding'
      })
      await refreshStatus()
      navigate('/onboarding/booking')
    } catch (err) {
      console.error(err)
      alert("Failed to create contact. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
           <Contact className="h-6 w-6 text-rose-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Add Your First Contact</h2>
          <p className="text-[var(--text-muted)] text-sm">Start building your customer database</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Name *</label>
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                <User className="w-4 h-4" />
             </div>
             <input 
               type="text" 
               className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
               placeholder="Full Name"
               required
               value={form.name}
               onChange={(e) => setForm({...form, name: e.target.value})}
             />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {/* Email */}
           <div>
             <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email</label>
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                   <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
             </div>
           </div>

           {/* Phone */}
           <div>
             <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Phone</label>
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                   <Phone className="w-4 h-4" />
                </div>
                <input 
                  type="tel" 
                  className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                />
             </div>
           </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Notes</label>
          <div className="relative">
             <div className="absolute left-4 top-3 text-[var(--text-secondary)]">
                <FileText className="w-4 h-4" />
             </div>
             <textarea 
               className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)] resize-none h-24"
               placeholder="Internal notes, preferences, etc."
               value={form.notes}
               onChange={(e) => setForm({...form, notes: e.target.value})}
             />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading || !form.name}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/onboarding/booking')}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center"
            >
              Skip
              <SkipForward className="w-4 h-4" />
            </button>
        </div>
      </form>
    </div>
  )
}
