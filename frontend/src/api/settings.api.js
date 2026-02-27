import api from './axios'

export const updateProfile = (data) => api.patch('/settings/profile', data)

export const changePassword = (data) => api.post('/settings/password', data)

export const sendEmailOTP = (new_email) => api.post('/settings/email/otp', { new_email })

export const verifyEmailOTP = (new_email, otp) => api.post('/settings/email/verify', { new_email, otp })

export const getWorkspace = () => api.get('/settings/workspace')

export const updateWorkspace = (data) => api.patch('/settings/workspace', data)

export const deleteWorkspace = () => api.delete('/settings/workspace')

export const getNotificationPreferences = () => api.get('/settings/notifications')

export const updateNotificationPreferences = (data) => api.patch('/settings/notifications', data)

export const getBillingSettings = () => api.get('/settings/billing') 
