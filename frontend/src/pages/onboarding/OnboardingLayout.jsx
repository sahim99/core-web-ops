import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from "../../api/axios";

const STEPS = [
  { id: 'email', label: 'Connect Email', path: '/onboarding/email' },
  { id: 'contacts', label: 'Contacts (CRM)', path: '/onboarding/contacts' },
  { id: 'booking', label: 'Configure Booking', path: '/onboarding/booking' },
  { id: 'form', label: 'Create Form', path: '/onboarding/form' },
  { id: 'inventory', label: 'Add Inventory', path: '/onboarding/inventory' },
  { id: 'staff', label: 'Add Staff', path: '/onboarding/staff' },
  { id: 'activate', label: 'Activate', path: '/onboarding/activate' },
]

export default function OnboardingLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await api.get('/onboarding/status')
      setStatus(res.data)
      
      // If already active, redirect to dashboard
      if (res.data.is_active) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error("Failed to fetch onboarding status", err)
    } finally {
      setLoading(false)
    }
  }

  const isStepComplete = (stepId) => {
    if (!status) return false
    // Map step IDs to API completed keys
    const map = {
      'email': 'email_configured',
      'contacts': 'contacts_configured', // We'll need to support this or just leave it open
      'booking': 'booking_configured',
      'form': 'forms_configured',
      'inventory': 'inventory_configured',
      'staff': 'owner_registered',
      'activate': 'workspace_activated' 
    }
    
    if (stepId === 'staff') return false 
    
    const key = map[stepId]
    return status.steps_completed[key]
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const currentStepIndex = STEPS.findIndex(s => s.path === location.pathname)
  const currentStep = currentStepIndex + 1;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Progress Panel */}
      <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-800 flex-shrink-0 backdrop-blur-xl z-20">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl text-[var(--text-primary)] tracking-tight">CoreWebOps</h1>
              <p className="text-xs text-indigo-400 font-medium">Setup Wizard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 relative">
             {/* Connector Line */}
             <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-800 -z-10" />

            {STEPS.map((step, index) => { 
              const completed = isStepComplete(step.id) 
              const isCurrent = currentStep === index + 1
              
              return (
                <div key={step.id} className={`group flex items-start py-3 ${isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20 rounded-xl -mx-3 px-3 transition-all' : 'px-0'}`}>
                  <div className="flex items-center h-6">
                    {completed ? ( 
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)] z-10">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-8 w-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] z-10">
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10">
                         <div className="h-2 w-2 rounded-full bg-slate-800" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className={`text-sm font-medium transition-colors ${
                      completed ? 'text-emerald-400' : 
                      isCurrent ? 'text-[var(--text-primary)]' : 
                      'text-[var(--text-secondary)]'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate group-hover:text-[var(--text-muted)] transition-colors">
                      {index === 0 ? 'Create your workspace' : 
                       index === 1 ? 'Connect integrations' : 
                       'Invite your team'}
                    </p>
                  </div>
                  {isCurrent && <ChevronRight className="w-4 h-4 text-indigo-400 mt-1 opacity-50" />}
                </div>
              )
            })}
          </nav>
        </div>
        
        {/* User Footer */}
        <div className="p-6 mt-auto border-t border-slate-800">
           <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-md">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.full_name}</p>
                 <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-slate-950">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
           <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] mix-blend-screen" />
        </div>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-auto relative z-10">
          <div className="w-full max-w-xl animate-fade-in-up">
            <Outlet context={{ status, refreshStatus: fetchStatus }} />
          </div>
        </main>
      </div>
    </div>
  )
}
