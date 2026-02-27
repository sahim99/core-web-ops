import './ContactForm.css'

function BookingPage() {
  return (
    <div className="public-page">
      <div className="public-container animate-fade-in">
        <div className="public-header">
          <div className="public-logo">⚡</div>
          <h1>Book a Service</h1>
          <p>Select a service and pick a time that works for you.</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Booking functionality will be available in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
