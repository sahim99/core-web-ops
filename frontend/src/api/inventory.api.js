import api from './axios'

export const listInventory = (search = '', lowStockOnly = false, skip = 0, limit = 50) =>
  api.get('/inventory', { params: { search, low_stock_only: lowStockOnly, skip, limit } })

export const getInventoryItem = (id) => api.get(`/inventory/${id}`)

export const createInventoryItem = (data) => api.post('/inventory', data)

export const updateInventoryItem = (id, data) => api.put(`/inventory/${id}`, data)

export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`)
