import api from './axios'

// ── Forms ──────────────────────────────────────────────────────

export const listForms = (skip = 0, limit = 50) =>
  api.get('/forms', { params: { skip, limit } })

export const getForm = (id) => api.get(`/forms/${id}`)

export const createForm = (data) => api.post('/forms', data)

export const updateForm = (id, data) => api.put(`/forms/${id}`, data)

export const deleteForm = (id) => api.delete(`/forms/${id}`)

// ── Fields ─────────────────────────────────────────────────────

export const addField = (formId, data) => api.post(`/forms/${formId}/fields`, data)

export const updateField = (formId, fieldId, data) => api.put(`/forms/${formId}/fields/${fieldId}`, data)

export const deleteField = (formId, fieldId) => api.delete(`/forms/${formId}/fields/${fieldId}`)

export const reorderFields = (formId, fieldIds) => api.put(`/forms/${formId}/fields/reorder`, fieldIds)

// ── Submissions (Authenticated) ────────────────────────────────

export const listSubmissions = (formId, skip = 0, limit = 50) =>
  api.get(`/forms/${formId}/submissions`, { params: { skip, limit } })

export const approveSubmission = (formId, subId) => api.post(`/forms/${formId}/submissions/${subId}/approve`)

export const rejectSubmission = (formId, subId) => api.post(`/forms/${formId}/submissions/${subId}/reject`)

// ── Public ─────────────────────────────────────────────────────

export const getPublicForm = (slug) => api.get(`/forms/public/${slug}`)

export const submitPublicForm = (slug, data) => api.post(`/forms/public/${slug}/submit`, data)
