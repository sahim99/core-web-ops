import api from './axios'

export const listBookings = (status = '', skip = 0, limit = 50) =>
  api.get('/bookings', { params: { status: status || undefined, skip, limit } })

export const getBooking = (id) => api.get(`/bookings/${id}`)

export const createBooking = (data) => api.post('/bookings', data)

// Confirm booking
export const confirmBooking = (id) => api.post(`/bookings/${id}/confirm`, {})

export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data) // Not used yet? Or maybe for notes?

export const deleteBooking = (id) => api.delete(`/bookings/${id}`)
