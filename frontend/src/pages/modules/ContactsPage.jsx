import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { listContacts, createContact, updateContact, deleteContact } from '../../api/contacts.api'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  TruckIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'all', label: 'All Contacts', type: null, icon: UsersIcon },
  { id: 'customer', label: 'Customers', type: 'customer', icon: UserGroupIcon },
  { id: 'provider', label: 'Providers', type: 'provider', icon: BriefcaseIcon },
  { id: 'vendor', label: 'Vendors', type: 'vendor', icon: TruckIcon },
]

function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  
  // Form state
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    source: 'manual', 
    contact_type: 'customer',
    notes: '' 
  })
  
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    setLoading(true)
    const typeFilter = TABS.find(t => t.id === activeTab)?.type
    try {
      // Pass type filter to API
      const res = await listContacts(search, typeFilter)
      setContacts(res.data)
    } catch (err) {
      console.error('Failed to fetch contacts', err)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  // Refetch when tab or search changes
  useEffect(() => { 
    const timer = setTimeout(() => fetchContacts(), 300)
    return () => clearTimeout(timer)
  }, [search, activeTab])

  const openCreate = () => {
    setEditing(null)
    const defaultType = TABS.find(t => t.id === activeTab)?.type || 'customer'
    setForm({ 
        name: '', 
        email: '', 
        phone: '', 
        source: 'manual', 
        contact_type: defaultType,
        notes: '' 
    })
    setShowModal(true)
  }

  const openEdit = (contact) => {
    setEditing(contact)
    setForm({ 
        name: contact.name, 
        email: contact.email || '', 
        phone: contact.phone || '', 
        source: contact.source, 
        contact_type: contact.contact_type || 'customer',
        notes: contact.notes || '' 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateContact(editing.id, form)
        toast.success('Contact updated')
      } else {
        await createContact(form)
        toast.success('Contact created')
      }
      setShowModal(false)
      fetchContacts()
    } catch (err) {
      console.error('Save failed', err)
      toast.error('Failed to save contact')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteContact(id)
      toast.success('Contact deleted')
      fetchContacts()
    } catch (err) {
      console.error('Delete failed', err)
      toast.error('Failed to delete contact')
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Contacts (CRM)</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Manage your business relationships.</p>
              </div>
              <button 
                onClick={openCreate} 
                className="btn btn-primary shadow-lg shadow-indigo-500/20 flex items-center gap-2 self-start md:self-auto"
              >
                <PlusIcon className="h-5 w-5" />
                Add Contact
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)]/50 p-1.5 rounded-xl border border-[var(--border-subtle)]">
               {/* Tabs */}
               <div className="flex p-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] w-full md:w-auto overflow-x-auto no-scrollbar">
                  {TABS.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-[var(--text-primary)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'}`}
                     >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                     </button>
                  ))}
               </div>

               {/* Search */}
               <div className="relative w-full md:w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                  />
               </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1,2,3].map(i => (
                    <div key={i} className="h-40 bg-[var(--bg-secondary)] rounded-2xl animate-pulse border border-[var(--border-subtle)]"></div>
                 ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-subtle)] flex flex-col items-center border-dashed">
                <div className="h-16 w-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <UserGroupIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">No {activeTab !== 'all' ? TABS.find(t=>t.id===activeTab)?.label.toLowerCase() : 'contacts'} found</h3>
                <p className="text-[var(--text-secondary)] mt-1 max-w-sm">Try adjusting your search or add a new contact.</p>
                <button onClick={openCreate} className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300">
                  + Add Contact
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contacts.map((c) => (
                  <div key={c.id} className="group bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden flex flex-col justify-between h-full">
                    
                    {/* Actions Overlay */}
                    <div className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                       <button onClick={() => openEdit(c)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)]/90 rounded-lg backdrop-blur shadow-lg border border-[var(--border-default)] transition-transform hover:scale-105" title="Edit">
                          <PencilSquareIcon className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(c.id)} className="p-2 text-[var(--text-muted)] hover:text-red-400 bg-[var(--bg-primary)]/90 rounded-lg backdrop-blur shadow-lg border border-[var(--border-default)] transition-transform hover:scale-105" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                       </button>
                    </div>

                    <div>
                        <div className="flex items-start gap-4 mb-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shadow-inner shrink-0 ${
                               c.contact_type === 'provider' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                               c.contact_type === 'vendor' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                               'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                           }`}>
                              {c.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-[var(--text-primary)] text-base truncate pr-8" title={c.name}>{c.name}</h3>
                              <div className="flex flex-wrap gap-2 mt-1">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                                      c.contact_type === 'provider' ? 'text-orange-400 border-orange-500/20 bg-orange-500/5' :
                                      c.contact_type === 'vendor' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' :
                                      'text-indigo-400 border-indigo-500/20 bg-indigo-500/5'
                                  }`}>
                                     {c.contact_type || 'Customer'}
                                  </span>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] border border-slate-700/50 px-1.5 py-0.5 rounded bg-[var(--bg-glass-hover)]">
                                     {c.source}
                                  </span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3 mb-4">
                           <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                              <EnvelopeIcon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                              <span className="truncate" title={c.email}>{c.email || '—'}</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                              <PhoneIcon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                              <span>{c.phone || '—'}</span>
                           </div>
                        </div>
                    </div>

                    {c.notes && (
                       <div className="pt-3 border-t border-[var(--border-subtle)] mt-auto">
                          <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2">"{c.notes}"</p>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)]">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-[var(--border-default)]">
               <h2 className="text-lg font-bold text-[var(--text-primary)]">{editing ? 'Edit Contact' : 'New Contact'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Name *</label>
                 <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
              </div>
              
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact Type</label>
                 <select 
                    className="form-select w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none appearance-none"
                    value={form.contact_type}
                    onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
                 >
                    <option value="customer">Customer</option>
                    <option value="provider">Provider</option>
                    <option value="vendor">Vendor</option>
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</label>
                    <input type="email" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email Address" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Phone</label>
                    <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Notes</label>
                 <textarea className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none resize-none" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                   {editing ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactsPage
