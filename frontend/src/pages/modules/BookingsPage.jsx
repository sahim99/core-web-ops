import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { listBookings, createBooking, deleteBooking, confirmBooking } from '../../api/booking.api'
import { listContacts } from '../../api/contacts.api'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { 
  CalendarDaysIcon, 
  UserCircleIcon,
  TrashIcon, 
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  ListBulletIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled']
const STATUS_PRIORITY = { pending: 0, confirmed: 1, cancelled: 2 }

function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)
  const [form, setForm] = useState({ title: '', start_time: '', end_time: '', description: '', contact_id: '' })
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [activeTab, setActiveTab] = useState('list') // 'list' or 'calendar'

  const sortBookings = (data) => {
    return [...data].sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 3
      const pb = STATUS_PRIORITY[b.status] ?? 3
      if (pa !== pb) return pa - pb
      if (!a.start_time && b.start_time) return -1
      if (a.start_time && !b.start_time) return 1
      if (a.start_time && b.start_time) return new Date(a.start_time) - new Date(b.start_time)
      return 0
    })
  }

  const fetchBookings = async () => {
    try {
      const res = await listBookings(statusFilter)
      setBookings(sortBookings(res.data))
    } catch (err) {
      console.error('Failed to fetch bookings', err)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const res = await listContacts()
      setContacts(res.data)
    } catch (err) {
      console.error('Failed to fetch contacts', err)
    }
  }

  useEffect(() => { fetchBookings() }, [statusFilter])
  useEffect(() => { fetchContacts() }, [])

  const openCreate = () => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    const nextHour = new Date(now)
    nextHour.setHours(now.getHours() + 1)
    setForm({ 
        title: 'New Appointment', 
        start_time: now.toISOString().slice(0, 16), 
        end_time: nextHour.toISOString().slice(0, 16), 
        description: '', 
        contact_id: '' 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createBooking({ ...form, contact_id: parseInt(form.contact_id) })
      setShowModal(false)
      toast.success('Booking created')
      fetchBookings()
    } catch (err) {
      console.error('Create failed', err)
      toast.error('Failed to create booking')
    }
  }

  const handleConfirm = async (id) => {
    setConfirmingId(id)
    setConfirmModal(null)
    try {
      await confirmBooking(id)
      toast.success('Booking confirmed!')
      setBookings(prev => sortBookings(prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b)))
    } catch (err) {
      console.error('Confirm failed', err)
      toast.error(err.response?.status === 400 ? err.response.data.detail : 'Failed to confirm')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleDelete = async (id) => {
    setConfirmModal(null)
    setViewModal(null)
    try {
      await deleteBooking(id)
      toast.success('Booking cancelled')
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
      toast.error('Failed to cancel')
    }
  }

  const getStatusBadge = (status) => {
    const cfg = {
      confirmed: { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', icon: <CheckCircleIcon className="w-3 h-3" />, label: 'Confirmed' },
      cancelled: { bg: 'bg-red-500/15 text-red-400 border-red-500/40', icon: <XMarkIcon className="w-3 h-3" />, label: 'Cancelled' },
      pending:   { bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40 animate-pulse', icon: <ClockIcon className="w-3 h-3" />, label: 'Pending' }
    }
    const c = cfg[status] || cfg.pending
    return <span className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-full border uppercase tracking-wide ${c.bg}`}>{c.icon}{c.label}</span>
  }

  const getCalendarStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#10b981'
      case 'cancelled': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const calendarEvents = bookings
    .filter(b => b.start_time)
    .map(b => ({
      id: b.id.toString(),
      title: `${b.title === 'Booking: book' ? 'Booking' : b.title} (${b.contact_name})`,
      start: b.start_time,
      end: b.end_time,
      backgroundColor: getCalendarStatusColor(b.status),
      borderColor: getCalendarStatusColor(b.status),
      extendedProps: { ...b }
    }))

  const handleCalendarEventClick = (info) => {
    const booking = info.event.extendedProps
    setViewModal(booking)
  }

  const cleanTitle = (title) => title === 'Booking: book' ? 'Booking Request' : title

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
             
             {/* Header */}
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Bookings</h1>
                   <p className="text-sm text-[var(--text-muted)] mt-1">Manage appointments, calls, and service schedules.</p>
                </div>
                <button 
                   onClick={openCreate}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg shadow-lg shadow-indigo-500/20 transition-colors font-medium border border-transparent"
                >
                   <PlusIcon className="w-5 h-5" />
                   New Booking
                </button>
             </div>

             {/* Tabs + Filters */}
             <div className="flex items-center justify-between gap-4">
                {/* View Tabs */}
                <div className="flex bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-1">
                   <button 
                      onClick={() => setActiveTab('list')} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-[var(--text-primary)] shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'}`}
                   >
                      <ListBulletIcon className="w-4 h-4" />
                      List
                   </button>
                   <button 
                      onClick={() => setActiveTab('calendar')} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-[var(--text-primary)] shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'}`}
                   >
                      <CalendarDaysIcon className="w-4 h-4" />
                      Calendar
                   </button>
                </div>

                {/* Status Filter */}
                {activeTab === 'list' && (
                  <div className="relative">
                     <FunnelIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                     <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-8 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-colors"
                     >
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                     </select>
                  </div>
                )}
             </div>

             {/* ═══════ LIST VIEW ═══════ */}
             {activeTab === 'list' && (
             <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-xl">
               <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-[#1a1a2e] border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-muted)] font-bold tracking-wider">
                     <tr>
                        <th className="px-6 py-4 w-[25%]">Service Details</th>
                        <th className="px-6 py-4 w-[14%]">Status</th>
                        <th className="px-6 py-4 w-[18%]">Schedule</th>
                        <th className="px-6 py-4 w-[23%]">Notes</th>
                        <th className="px-6 py-4 text-center w-[20%]">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {loading ? (
                        <tr><td colSpan="5" className="p-8 text-center text-[var(--text-secondary)]">Loading...</td></tr>
                     ) : bookings.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="p-12 text-center text-[var(--text-secondary)]">
                              <div className="flex flex-col items-center justify-center">
                                <CalendarDaysIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p>No bookings found</p>
                              </div>
                           </td>
                        </tr>
                     ) : bookings.map(b => (
                        <tr key={b.id} className={`hover:bg-[var(--bg-glass)] transition-all duration-300 group ${b.status === 'pending' ? 'bg-yellow-500/[0.03] border-l-4 border-l-yellow-500/60' : 'border-l-4 border-l-transparent'}`}>
                           {/* Service Details */}
                           <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{cleanTitle(b.title)}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                                   <UserCircleIcon className="w-3.5 h-3.5" />
                                   {b.contact_name || 'Unknown'} • ID #{b.contact_id}
                                </p>
                              </div>
                           </td>
                           {/* Status */}
                           <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                           {/* Schedule */}
                           <td className="px-6 py-4 text-sm">
                              {b.start_time ? (
                                 <div className="flex flex-col">
                                    <span className="font-medium text-[var(--text-primary)]">
                                       {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <div className="flex gap-1 text-xs text-[var(--text-secondary)] mt-0.5">
                                        <span>{new Date(b.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                        <span>–</span>
                                        <span>{b.end_time ? new Date(b.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}</span>
                                    </div>
                                 </div>
                              ) : (
                                 <span className="italic text-[var(--text-secondary)] text-xs">Not scheduled</span>
                              )}
                           </td>
                           {/* Notes */}
                           <td className="px-6 py-4 text-sm text-[var(--text-muted)] truncate">{b.description || '—'}</td>
                           {/* Actions */}
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                 {b.status === 'pending' && (
                                    <>
                                       <button 
                                          onClick={() => setConfirmModal(b)} 
                                          disabled={confirmingId === b.id}
                                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                                       >
                                          {confirmingId === b.id ? (
                                             <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                          ) : (
                                             <CheckCircleIcon className="w-3.5 h-3.5" />
                                          )}
                                          {confirmingId === b.id ? 'Confirming...' : 'Confirm'}
                                       </button>
                                       <button 
                                          onClick={() => handleDelete(b.id)} 
                                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-red-500/15 border border-[var(--border-default)] hover:border-red-500/30 text-[var(--text-muted)] hover:text-red-400 text-xs font-semibold transition-all"
                                       >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                          Cancel
                                       </button>
                                    </>
                                 )}
                                 {b.status === 'confirmed' && (
                                    <>
                                       <button onClick={() => setViewModal(b)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all">
                                          <EyeIcon className="w-3.5 h-3.5" />
                                          View
                                       </button>
                                       <button 
                                          onClick={() => handleDelete(b.id)} 
                                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-red-500/15 border border-[var(--border-default)] hover:border-red-500/30 text-[var(--text-muted)] hover:text-red-400 text-xs font-semibold transition-all"
                                       >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                          Cancel
                                       </button>
                                    </>
                                 )}
                                 {b.status === 'cancelled' && (
                                    <span className="text-xs text-[var(--text-secondary)] italic">No actions</span>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
             )}

             {/* ═══════ CALENDAR VIEW ═══════ */}
             {activeTab === 'calendar' && (
             <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-4 overflow-hidden relative" style={{ minHeight: 'calc(100vh - 16rem)' }}>
                {loading && (
                  <div className="absolute inset-0 bg-[var(--bg-secondary)]/80 z-10 flex items-center justify-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                )}
                
                <style>{`
                  .fc { --fc-border-color: rgba(255,255,255,0.05); }
                  .fc-theme-standard th { border-color: rgba(255,255,255,0.05) !important; color: #94a3b8; font-weight: 600; padding-bottom: 8px; }
                  .fc-theme-standard td { border-color: rgba(255,255,255,0.05) !important; }
                  .fc-day-today { background: rgba(99, 102, 241, 0.05) !important; }
                  .fc-event { border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); cursor: pointer; border: none; }
                  .fc-toolbar-title { color: white; font-size: 1.25rem !important; font-weight: 700; }
                  .fc-button { background-color: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.05) !important; color: #e2e8f0 !important; font-weight: 600; text-transform: capitalize; transition: all 0.2s; }
                  .fc-button:hover { background-color: rgba(255,255,255,0.1) !important; }
                  .fc-button-active { background-color: #4f46e5 !important; border-color: #4f46e5 !important; color: white !important; }
                  .fc-timegrid-slot-label-cushion { color: #64748b; }
                  .fc-col-header-cell-cushion { color: #94a3b8; text-decoration: none; }
                  .fc-daygrid-day-number { color: #94a3b8; text-decoration: none; }
                  .fc-daygrid-day-number:hover { color: white; }
                `}</style>
                
                <FullCalendar
                  plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  eventClick={handleCalendarEventClick}
                  height="auto"
                  contentHeight="auto"
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  allDaySlot={false}
                />

                {/* Unscheduled hint */}
                {bookings.filter(b => !b.start_time).length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400/80 flex items-center gap-2">
                     <ClockIcon className="w-4 h-4 flex-shrink-0" />
                     <span>
                       <strong>{bookings.filter(b => !b.start_time).length}</strong> unscheduled booking(s) not shown on calendar. Switch to <button onClick={() => setActiveTab('list')} className="underline hover:text-yellow-300 font-semibold">List view</button> to see all.
                     </span>
                  </div>
                )}
             </div>
             )}

          </div>
        </main>
      </div>

      {/* ── View Detail Modal ── */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
                 <h2 className="text-lg font-bold text-[var(--text-primary)]">Booking Details</h2>
                 <button onClick={() => setViewModal(null)} className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Service</p>
                       <p className="text-[var(--text-primary)] font-medium">{cleanTitle(viewModal.title)}</p>
                    </div>
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Status</p>
                       {getStatusBadge(viewModal.status)}
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Customer</p>
                       <p className="text-[var(--text-primary)] font-medium flex items-center gap-1.5">
                          <UserCircleIcon className="w-4 h-4 text-[var(--text-muted)]" />
                          {viewModal.contact_name || 'Unknown'}
                       </p>
                    </div>
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Contact ID</p>
                       <p className="text-[var(--text-secondary)]">#{viewModal.contact_id}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Schedule</p>
                       {viewModal.start_time ? (
                          <div>
                             <p className="text-[var(--text-primary)] font-medium">{new Date(viewModal.start_time).toLocaleDateString()}</p>
                             <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {new Date(viewModal.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {viewModal.end_time && ` → ${new Date(viewModal.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                             </p>
                          </div>
                       ) : (
                          <p className="italic text-yellow-400/80">Not scheduled</p>
                       )}
                    </div>
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Created</p>
                       <p className="text-[var(--text-secondary)]">{new Date(viewModal.created_at).toLocaleDateString()}</p>
                    </div>
                 </div>
                 {viewModal.description && (
                    <div>
                       <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Notes</p>
                       <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-glass-hover)] rounded-lg p-3 border border-[var(--border-subtle)]">{viewModal.description}</p>
                    </div>
                 )}
              </div>
              <div className="p-6 pt-2 flex gap-3">
                 <button onClick={() => setViewModal(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]">
                    Close
                 </button>
                 <button onClick={() => { handleDelete(viewModal.id); setViewModal(null) }} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                    <XMarkIcon className="w-4 h-4" />
                    Cancel Booking
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[var(--border-default)] flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-yellow-500/15">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                 </div>
                 <h2 className="text-lg font-bold text-[var(--text-primary)]">Confirm this booking?</h2>
              </div>
              <div className="p-6 space-y-3">
                 <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Customer:</span>
                    <span className="text-[var(--text-primary)] font-medium">{confirmModal.contact_name || 'Unknown'}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Service:</span>
                    <span className="text-[var(--text-primary)] font-medium">{cleanTitle(confirmModal.title)}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Date:</span>
                    <span className={confirmModal.start_time ? 'text-[var(--text-primary)] font-medium' : 'text-yellow-400 italic'}>
                       {confirmModal.start_time ? new Date(confirmModal.start_time).toLocaleString() : 'Not scheduled'}
                    </span>
                 </div>
              </div>
              <div className="p-6 pt-2 flex gap-3">
                 <button 
                    onClick={() => setConfirmModal(null)} 
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={() => handleConfirm(confirmModal.id)} 
                    disabled={confirmingId === confirmModal.id}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {confirmingId === confirmModal.id ? (
                       <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                       <>
                         <CheckCircleIcon className="w-4 h-4" />
                         Yes, Confirm
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ── Create Booking Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)]">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-[var(--border-default)]">
               <h2 className="text-lg font-bold text-[var(--text-primary)]">New Booking</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Title *</label>
                 <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Consultation Call" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact *</label>
                 <select className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" required value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
                   <option value="">Select a contact...</option>
                   {contacts.map((c) => (
                     <option key={c.id} value={c.id}>{c.name} ({c.email || c.phone || 'No info'})</option>
                   ))}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Start Time</label>
                     <input type="datetime-local" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">End Time</label>
                     <input type="datetime-local" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
                  </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                 <textarea className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Book Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingsPage
