import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import FormBuilder from '../../components/forms/FormBuilder'
import { listForms, createForm, deleteForm, listSubmissions, getForm, approveSubmission, rejectSubmission } from '../../api/forms.api'
import { 
  ClipboardDocumentCheckIcon, 
  TrashIcon, 
  PlusIcon,
  DocumentTextIcon, 
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  PuzzlePieceIcon,
  TableCellsIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

function FormsPage() {
  const [forms, setForms] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', purpose: 'CUSTOM' })
  const [selectedForm, setSelectedForm] = useState(null)
  const [activeTab, setActiveTab] = useState('builder') // 'builder' or 'submissions'
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchForms = async () => {
    try {
      const res = await listForms()
      setForms(res.data)
      // Refresh selected form if it exists
      if (selectedForm) {
        try {
          const detailed = await getForm(selectedForm.id)
          setSelectedForm(detailed.data)
        } catch (e) {
          console.error("Failed to refresh selected form", e)
        }
      }
    } catch (err) {
      console.error('Failed to fetch forms', err)
      toast.error('Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchForms() }, [])

  const openCreate = () => {
    setForm({ title: '', description: '', purpose: 'CUSTOM' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await createForm(form)
      setShowModal(false)
      toast.success('Form created')
      await fetchForms()
      // Auto-select the new form
      if (res.data) {
        handleSelectForm(res.data)
      }
    } catch (err) {
      console.error('Create failed', err)
      toast.error('Failed to create form')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this form and all its submissions?')) return
    try {
      await deleteForm(id)
      if (selectedForm?.id === id) {
        setSelectedForm(null)
        setSubmissions([])
      }
      toast.success('Form deleted')
      fetchForms()
    } catch (err) {
      console.error('Delete failed', err)
      toast.error('Failed to delete form')
    }
  }

  const handleSelectForm = async (f) => {
    try {
        // Fetch full details including fields
        const res = await getForm(f.id)
        setSelectedForm(res.data)
        setActiveTab('builder') 
    } catch (err) {
        toast.error('Failed to load form details')
        console.error(err)
    }
  }

  const handleCopyLink = (e, slug) => {
    e.stopPropagation()
    const url = `${window.location.origin}/forms/public/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  // Fetch submissions when tab changes to submissions
  useEffect(() => {
    if (selectedForm && activeTab === 'submissions') {
      fetchSubmissions(selectedForm.id)
    }
  }, [selectedForm, activeTab])

  const fetchSubmissions = async (id) => {
    try {
      const res = await listSubmissions(id)
      setSubmissions(res.data)
    } catch (err) {
      console.error('Failed to fetch submissions', err)
      toast.error('Failed to load submissions')
    }
  }

  const handleActionSubmission = async (subId, action) => {
    try {
      if (action === 'approve') {
         await approveSubmission(selectedForm.id, subId)
      } else {
         await rejectSubmission(selectedForm.id, subId)
      }
      toast.success(`Submission ${action}d successfully`)
      fetchSubmissions(selectedForm.id)
    } catch (err) {
      console.error(`Failed to ${action} submission`, err)
      toast.error(`Failed to ${action} submission`)
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 flex overflow-hidden">
           {/* ── Pane 1: Forms List (30%) ── */}
           <div className={`flex-1 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 transition-all duration-300 ${selectedForm ? 'max-w-sm hidden md:flex' : 'max-w-full'}`}>
              
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                 <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Forms</h1>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Manage & Build</p>
                 </div>
                 <button onClick={openCreate} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg shadow-lg shadow-indigo-500/20 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {loading ? (
                    <div className="text-center p-8 text-[var(--text-secondary)]">Loading...</div>
                 ) : forms.length === 0 ? (
                    <div className="text-center p-8 text-[var(--text-secondary)] flex flex-col items-center">
                       <DocumentTextIcon className="w-12 h-12 mb-3 opacity-20" />
                       <p>No forms created yet.</p>
                    </div>
                 ) : (
                    forms.map(f => (
                       <div 
                          key={f.id} 
                          onClick={() => handleSelectForm(f)}
                          className={`group p-4 rounded-xl border cursor-pointer transition-all ${selectedForm?.id === f.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-glass-hover)]'}`}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <h3 className={`font-bold ${selectedForm?.id === f.id ? 'text-indigo-400' : 'text-[var(--text-primary)]'}`}>{f.title}</h3>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${f.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/30 text-[var(--text-muted)]'}`}>
                                {f.status}
                             </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{f.description || 'No description provided.'}</p>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                                {f.fields?.length || 0} Fields
                             </span>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleCopyLink(e, f.public_slug)} className="p-1.5 hover:bg-indigo-500/10 rounded text-[var(--text-muted)] hover:text-indigo-400" title="Copy Link">
                                   <LinkIcon className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => {e.stopPropagation(); handleDelete(f.id)}} className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400" title="Delete">
                                   <TrashIcon className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* ── Pane 2: Detail View (Builder/Submissions) ── */}
           {selectedForm ? (
              <div className="flex-[3] flex flex-col bg-[var(--bg-primary)] relative animate-fade-in min-w-0">
                 {/* Header & Tabs */}
                 <div className="h-16 border-b border-[var(--border-subtle)] flex items-center justify-between px-6 bg-[var(--bg-secondary)]/30 shrink-0">
                    <div className="flex items-center gap-4">
                       <button 
                          onClick={() => setSelectedForm(null)}
                          className="md:hidden text-sm text-indigo-400"
                       >
                          Back
                       </button>
                       <div className="flex bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border-subtle)]">
                          <button 
                             onClick={() => setActiveTab('builder')}
                             className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'builder' ? 'bg-indigo-600 text-[var(--text-primary)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                             <PuzzlePieceIcon className="w-4 h-4" />
                             Builder
                          </button>
                          <button 
                             onClick={() => setActiveTab('submissions')}
                             className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'submissions' ? 'bg-indigo-600 text-[var(--text-primary)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                             <TableCellsIcon className="w-4 h-4" />
                             Submissions
                          </button>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button 
                          onClick={(e) => handleCopyLink(e, selectedForm.public_slug)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
                       >
                          <LinkIcon className="w-4 h-4" />
                          Copy Link
                       </button>
                       <button 
                          onClick={() => window.open(`/forms/public/${selectedForm.public_slug}`, '_blank')}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-[var(--text-primary)] shadow-lg shadow-indigo-500/20 transition-colors"
                       >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          Open Public Link
                       </button>
                    </div>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'builder' ? (
                       <FormBuilder form={selectedForm} onUpdate={fetchForms} />
                    ) : (
                       <div className="h-full overflow-y-auto p-8">
                          {submissions.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
                                <ClipboardDocumentCheckIcon className="w-16 h-16 mb-4 opacity-10" />
                                <p>No submissions received yet.</p>
                             </div>
                          ) : (
                             <div className="space-y-4 max-w-4xl mx-auto">
                                {submissions.map((s, idx) => (
                                   <div key={s.id} className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                                      <div className="flex justify-between items-start mb-4">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                               <CheckBadgeIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                               <h4 className="text-sm font-bold text-[var(--text-primary)]">Submission #{submissions.length - idx}</h4>
                                               <p className="text-xs text-[var(--text-secondary)]">{new Date(s.created_at).toLocaleString()}</p>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-3">
                                            {s.status === 'pending' && (
                                               <div className="flex gap-2">
                                                  <button 
                                                     onClick={() => handleActionSubmission(s.id, 'approve')}
                                                     className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1 border border-emerald-500/20"
                                                  >
                                                     <CheckCircleIcon className="w-3.5 h-3.5" /> Approve
                                                  </button>
                                                  <button 
                                                     onClick={() => handleActionSubmission(s.id, 'reject')}
                                                     className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1 border border-red-500/20"
                                                  >
                                                     <XCircleIcon className="w-3.5 h-3.5" /> Reject
                                                  </button>
                                               </div>
                                            )}
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${s.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                               {s.status}
                                            </span>
                                         </div>
                                      </div>
                                      
                                      {/* Parse Answers */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-subtle)]">
                                         {s.answers && s.answers.map((answer, index) => (
                                            <div key={answer.id || idx + '-' + index}>
                                               <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-1 block">
                                                  {answer.field_label || `Field ${answer.field_id}`}
                                               </label>
                                               <div className="text-sm text-[var(--text-primary)]">
                                                  {answer.value || '—'}
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    )}
                 </div>
              </div>
           ) : (
              <div className="flex-[3] hidden md:flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-primary)]">
                 <DocumentTextIcon className="w-24 h-24 mb-6 opacity-10" />
                 <p className="text-xl font-bold text-[var(--text-secondary)]">Select a form to manage</p>
                 <p className="text-sm text-[var(--text-secondary)] mt-2">Design layout • View submissions • Share public link</p>
              </div>
           )}

        </main>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)]">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-[var(--border-default)]">
               <h2 className="text-lg font-bold text-[var(--text-primary)]">Create New Form</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Form Title *</label>
                 <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" 
                   required 
                   value={form.title} 
                   onChange={(e) => setForm({ ...form, title: e.target.value })} 
                   placeholder="e.g., Contact Request" 
                 />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Purpose</label>
                 <select className="form-select w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                   value={form.purpose}
                   onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                 >
                     <option value="CONTACT">Contact Us</option>
                     <option value="BOOKING">Booking Request</option>
                     <option value="INQUIRY">Inquiry / Feedback</option>
                     <option value="ONBOARDING">Onboarding</option>
                     <option value="CUSTOM">Custom</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                 <textarea className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe the purpose..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Create Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default FormsPage
