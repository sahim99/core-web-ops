import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, ArrowRight, SkipForward, Shield, Check } from 'lucide-react'
import api from "../../api/axios";

const PERMISSION_OPTIONS = [
  { id: 'inbox', label: 'Inbox Access', description: 'View and reply to messages' },
  { id: 'bookings', label: 'Bookings', description: 'Manage appointments' },
  { id: 'forms', label: 'Forms', description: 'Edit and view form submissions' },
  { id: 'inventory', label: 'Inventory', description: 'Manage stock levels' },
]

export default function StepStaff() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState({
    inbox: true,
    bookings: false,
    forms: false,
    inventory: false
  })
  const [loading, setLoading] = useState(false)

  const togglePermission = (id) => {
    setPermissions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    
    setLoading(true)
    try {
      await api.post('/staff', { 
        email, 
        full_name: name,
        password,
        permissions
      })
      navigate('/onboarding/activate')
    } catch (err) {
      console.error(err)
      alert('Failed to add staff member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
           <Users className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Add Team Member</h2>
          <p className="text-[var(--text-muted)] text-sm">Grow your team (Optional)</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                placeholder="Jane Doe"
              />
           </div>
           
           <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                placeholder="jane@example.com"
              />
           </div>
           
           <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Temporary Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                placeholder="••••••••"
              />
           </div>
        </div>

        {/* Permissions Section */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Access Permissions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERMISSION_OPTIONS.map((perm) => (
              <div 
                key={perm.id}
                onClick={() => togglePermission(perm.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  permissions[perm.id] 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                  permissions[perm.id]
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-slate-600'
                }`}>
                  {permissions[perm.id] && <Check className="w-3.5 h-3.5 text-[var(--text-primary)]" strokeWidth={3} />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${permissions[perm.id] ? 'text-indigo-300' : 'text-[var(--text-secondary)]'}`}>
                    {perm.label}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
                    {perm.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button 
            type="submit" 
            disabled={loading || !email}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </>
              )}
            </button>
            
            <button 
            type="button" 
            onClick={() => navigate('/onboarding/activate')}
            className="px-6 py-3 rounded-xl font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center"
            >
              Skip for now
              <SkipForward className="w-4 h-4" />
            </button>
        </div>
      </form>
    </div>
  )
}
