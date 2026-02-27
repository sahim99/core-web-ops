import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { listBookings } from '../../api/booking.api'
import { PlusIcon } from '@heroicons/react/24/outline'

function CalendarPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      // Fetch all bookings (could filter by date range in future)
      const res = await listBookings()
      
      // Transform to FullCalendar format
      const calendarEvents = res.data.map(b => ({
        id: b.id.toString(),
        title: `${b.title} (${b.contact_name})`,
        start: b.start_time,
        end: b.end_time,
        backgroundColor: getStatusColor(b.status),
        borderColor: getStatusColor(b.status),
        extendedProps: {
          description: b.description,
          status: b.status,
          contactId: b.contact_id
        }
      }))
      setEvents(calendarEvents)
    } catch (err) {
      console.error("Failed to load calendar events", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#10b981' // Emerald 500
      case 'cancelled': return '#ef4444' // Red 500
      default: return '#f59e0b' // Amber 500 (Pending)
    }
  }

  const handleEventClick = (info) => {
    // Future: Open detail modal
    alert(`Booking: ${info.event.title}\nStatus: ${info.event.extendedProps.status}`)
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Calendar</h1>
                  <p className="text-sm text-[var(--text-muted)]">Schedule overview</p>
               </div>
               <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg shadow-lg shadow-indigo-500/20 transition-colors font-medium text-sm">
                  <PlusIcon className="w-4 h-4" />
                  New Booking
               </button>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-4 overflow-hidden relative">
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
               `}</style>
               
               <FullCalendar
                 plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                 initialView="dayGridMonth"
                 headerToolbar={{
                   left: 'prev,next today',
                   center: 'title',
                   right: 'dayGridMonth,timeGridWeek,timeGridDay'
                 }}
                 events={events}
                 eventClick={handleEventClick}
                 height="100%"
                 slotMinTime="06:00:00"
                 slotMaxTime="22:00:00"
                 allDaySlot={false}
               />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CalendarPage
