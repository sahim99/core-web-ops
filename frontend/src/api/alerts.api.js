import api from './axios'

export const listAlerts = (params) => api.get('/alerts', { params })
export const getAlertCount = () => api.get('/alerts/count')
export const dismissAlert = (id) => api.post(`/alerts/${id}/dismiss`)
export const dismissAllAlerts = () => api.post('/alerts/dismiss-all')
export const syncInventoryAlerts = () => api.post('/alerts/sync-inventory')
