import { useState } from 'react'
import './ContactForm.css'

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Will connect to API in Phase 2
    setSubmitted(true)
  }

  return (
    <div className="public-page">
      <div className="public-container animate-fade-in">
        <div className="public-header">
          <div className="public-logo">⚡</div>
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Send us a message.</p>
        </div>

        {submitted ? (
          <div className="public-success">
            <span className="public-success-icon">✓</span>
            <h2>Thank you!</h2>
            <p>Your message has been received. We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="public-form">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
                id="contact-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                id="contact-email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                className="form-input"
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={handleChange}
                id="contact-phone"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-input"
                name="message"
                placeholder="Tell us how we can help..."
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                style={{ resize: 'vertical' }}
                id="contact-message"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} id="contact-submit">
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ContactForm
