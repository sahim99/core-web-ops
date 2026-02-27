import api from './axios'

export const listConversations = (params) => api.get('/inbox', { params })
export const getConversation = (id) => api.get(`/inbox/${id}`)
export const createConversation = (data) => api.post('/inbox', data)
export const deleteConversation = (id) => api.delete(`/inbox/${id}`)

// Messages
export const addMessage = (conversationId, data) => api.post(`/inbox/${conversationId}/messages`, data)
export const editMessage = (conversationId, messageId, data) => api.put(`/inbox/${conversationId}/messages/${messageId}`, data)

// Read status
export const markRead = (id) => api.post(`/inbox/${id}/mark-read`)
export const markAllRead = () => api.post('/inbox/mark-all-read')
export const getUnreadCount = () => api.get('/inbox/unread-count')
