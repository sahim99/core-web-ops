import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FileText, ArrowRight, Info, SkipForward } from 'lucide-react'
import api from "../../api/axios";

export default function StepForms() {
  const navigate = useNavigate()
  const { refreshStatus } = useOutletContext()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title) return
    
    setLoading(true)
    try {
      // Minimal form creation
      await api.post('/forms', { 
        title, 
        description: "Created during onboarding",
        fields_schema: [
          { id: "name", type: "text", label: "Full Name", required: true },
          { id: "email", type: "email", label: "Email Address", required: true },
          { id: "message", type: "textarea", label: "Message", required: false }
        ]
      })
      await refreshStatus()
      navigate('/onboarding/inventory')
    } catch (err) {
      console.error(err)
      alert('Failed to create form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
           <FileText className="h-6 w-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create Form</h2>
          <p className="text-[var(--text-muted)] text-sm">Capture data from your customers</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Form Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
            placeholder="e.g. Website Contact Form"
            required
          />
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex gap-3 text-sm text-[var(--text-muted)]">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <p>This will create a standard form with Name, Email, and Message fields. You can fully customize fields and validation rules in the main dashboard later.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => navigate('/onboarding/inventory')}
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
