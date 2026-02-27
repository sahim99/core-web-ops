import api from './axios'

export const listContacts = (search = '', contact_type = null, skip = 0, limit = 50) =>
  api.get('/contacts', { params: { search, contact_type, skip, limit } })

export const getContact = (id) => api.get(`/contacts/${id}`)

export const createContact = (data) => api.post('/contacts', data)

export const updateContact = (id, data) => api.put(`/contacts/${id}`, data)

export const deleteContact = (id) => api.delete(`/contacts/${id}`)
