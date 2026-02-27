import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { listStaff, addStaff, removeStaff } from '../../api/staff.api'
import { 
  UserPlusIcon, 
  TrashIcon, 
  ShieldCheckIcon, 
  UserIcon, 
  EnvelopeIcon,
  InboxIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CubeIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

function StaffPage() {
  const [staff, setStaff] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const [permissions, setPermissions] = useState({
    inbox: false,
    bookings: false,
    forms: false,
    inventory: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null) // { message, staffId }

  const fetchStaff = async () => {
    try {
      const res = await listStaff()
      setStaff(res.data)
    } catch (err) {
      console.error('Failed to fetch staff', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [])

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const openCreate = () => {
    setForm({ email: '', full_name: '', password: '' })
    setPermissions({ inbox: false, bookings: false, forms: false, inventory: false })
    setError('')
    setShowModal(true)
  }

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyStaffId = (id) => {
    navigator.clipboard.writeText(id)
    setToast({ message: 'Staff ID copied!', staffId: null })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate at least one permission is selected
    const hasPermission = Object.values(permissions).some(Boolean)
    if (!hasPermission) {
      setError('Please assign at least one module permission.')
      return
    }

    try {
      const payload = {
        ...form,
        permissions // Backend expects this nested object
      }
      const res = await addStaff(payload)
      setShowModal(false)
      // Show success toast with staff_id
      const newStaffId = res.data?.staff_id
      setToast({
        message: 'Staff created successfully',
        staffId: newStaffId || null,
      })
      fetchStaff()
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to add staff member'
      setError(msg)
    }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this staff member? They will lose access immediately.')) return
    try {
      await removeStaff(id)
      fetchStaff()
    } catch (err) {
      console.error('Remove failed', err)
    }
  }

  const PERMISSION_CONFIG = [
    { key: 'inbox', label: 'Inbox', icon: <InboxIcon className="w-5 h-5" />, desc: 'Access messages & chat' },
    { key: 'bookings', label: 'Bookings', icon: <CalendarDaysIcon className="w-5 h-5" />, desc: 'Manage appointments' },
    { key: 'forms', label: 'Forms', icon: <DocumentTextIcon className="w-5 h-5" />, desc: 'View submissions' },
    { key: 'inventory', label: 'Inventory', icon: <CubeIcon className="w-5 h-5" />, desc: 'Track stock levels' },
  ]

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
             
             {/* Header */}
             <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-6">
                <div>
                   <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                      Staff Management
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                         {staff.length} Active
                      </span>
                   </h1>
                   <p className="text-sm text-[var(--text-muted)] mt-1">Manage team access and permissions for your workspace.</p>
                </div>
                <button 
                   onClick={openCreate}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg shadow-lg shadow-indigo-500/20 transition-colors font-medium"
                >
                   <UserPlusIcon className="w-5 h-5" />
                   Add Staff
                </button>
             </div>

             {/* Staff List */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                   <div className="col-span-3 text-center p-12 text-[var(--text-secondary)]">Loading team...</div>
                ) : staff.length === 0 ? (
                   <div className="col-span-3 flex flex-col items-center justify-center p-16 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-subtle)]">
                      <UserIcon className="w-16 h-16 text-[var(--text-secondary)] mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">No staff members</h3>
                      <p className="text-[var(--text-secondary)] text-sm mt-1">Inviting team members helps you delegate tasks.</p>
                   </div>
                ) : (
                   staff.map((s) => (
                      <div key={s.id} className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col h-full">
                         <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {s.role !== 'owner' && (
                               <button onClick={() => handleRemove(s.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove User">
                                  <TrashIcon className="w-4 h-4" />
                               </button>
                            )}
                         </div>

                         <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border ${s.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                               {s.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <h3 className="font-bold text-[var(--text-primary)]">{s.full_name}</h3>
                               <div className="flex items-center gap-2 mt-1">
                                  {s.role === 'owner' ? (
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                                        <ShieldCheckIcon className="w-3 h-3" /> Owner
                                     </span>
                                  ) : (
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-glass-hover)] px-1.5 py-0.5 rounded">
                                        Staff
                                     </span>
                                  )}
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                               </div>
                            </div>
                         </div>

                         {/* Staff ID - Visible to owner */}
                         {s.staff_id && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                               <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">ID</span>
                               <span className="text-xs font-mono text-indigo-400 flex-1">{s.staff_id}</span>
                               <button 
                                  onClick={() => copyStaffId(s.staff_id)}
                                  className="p-1 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors"
                                  title="Copy Staff ID"
                               >
                                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         )}

                         {/* Permissions Icons */}
                         {s.role !== 'owner' && s.permissions && (
                            <div className="flex gap-2 mb-4 bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-subtle)]">
                               {PERMISSION_CONFIG.map(p => (
                                  <div 
                                    key={p.key} 
                                    className={`p-1 rounded ${s.permissions[p.key] ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-700'}`}
                                    title={s.permissions[p.key] ? p.label : 'No access'}
                                  >
                                    <div className="w-4 h-4">{p.icon}</div>
                                  </div>
                               ))}
                            </div>
                         )}

                         <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)] mt-auto">
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                               <EnvelopeIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                               <span className="truncate">{s.email}</span>
                            </div>
                            <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-2">
                               Joined: {new Date(s.created_at).toLocaleDateString()}
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>

          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div className="bg-[var(--bg-secondary)] border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 p-4 flex items-start gap-3 min-w-[300px] max-w-md">
            <div className="p-1.5 rounded-full bg-emerald-500/10">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{toast.message}</p>
              {toast.staffId && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">ID:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-xs font-mono text-indigo-400 border border-indigo-500/20">
                    {toast.staffId}
                  </span>
                  <button
                    onClick={() => copyStaffId(toast.staffId)}
                    className="p-0.5 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors"
                    title="Copy"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs mt-0.5">✕</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)] ">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border-default)] shrink-0">
               <h2 className="text-lg font-bold text-[var(--text-primary)]">Add Team Member</h2>
               <p className="text-sm text-[var(--text-muted)] mt-1">Create a user and assign access permissions.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {/* Section A: Basic Info */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">1. Basic Information</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Full Name *</label>
                       <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Alice Smith" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Email *</label>
                       <input type="email" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alice@example.com" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Temp Password *</label>
                    <input type="password" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                 </div>
              </div>

              {/* Section B: Permissions */}
              <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                 <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">2. Module Access</h3>
                    <span className="text-[10px] text-[var(--text-secondary)]">Select at least one</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    {PERMISSION_CONFIG.map((p) => (
                       <div 
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 ${permissions[p.key] ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] opacity-70 hover:opacity-100'}`}
                       >
                          <div className={`mt-0.5 p-1.5 rounded-lg ${permissions[p.key] ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-glass-hover)] text-[var(--text-muted)]'}`}>
                             {p.icon}
                          </div>
                          <div>
                             <h4 className={`text-sm font-bold ${permissions[p.key] ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{p.label}</h4>
                             <p className="text-[10px] text-[var(--text-secondary)] leading-tight mt-0.5">{p.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {error && <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center flex items-center justify-center gap-2">
                 <span className="font-bold">Error:</span> {error}
              </div>}

              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffPage
