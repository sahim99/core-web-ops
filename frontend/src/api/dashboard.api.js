import api from './axios'

export const getOwnerOverview = (range = 7) => api.get(`/dashboard/owner-overview?range=${range}`)

// Legacy (kept for backwards compat)
export const getOverview = () => api.get('/dashboard/overview')
export const getContactsStats = () => api.get('/dashboard/contacts')
export const getBookingsStats = () => api.get('/dashboard/bookings')
export const getInventoryStats = () => api.get('/dashboard/inventory')
export const getAlertsStats = () => api.get('/dashboard/alerts')
