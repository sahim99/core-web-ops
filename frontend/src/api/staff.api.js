import api from './axios'

export const listStaff = () => api.get('/staff')

export const addStaff = (data) => api.post('/staff', data)

export const removeStaff = (id) => api.delete(`/staff/${id}`)
