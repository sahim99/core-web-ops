import api from './axios'

export const getEventLogs = async ({ event_type, source, skip = 0, limit = 50 }) => {
  const params = { skip, limit }
  if (event_type) params.event_type = event_type
  if (source) params.source = source
  
  const response = await api.get('/event-logs/', { params })
  return response.data
}

export const getEventLog = async (id) => {
  const response = await api.get(`/event-logs/${id}`)
  return response.data
}
