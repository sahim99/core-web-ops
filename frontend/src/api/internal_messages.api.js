import api from './axios'

export const listMessages = () => api.get('/internal/messages').then(res => res.data)
export const sendMessage = (content) => api.post('/internal/messages', { content }).then(res => res.data)
