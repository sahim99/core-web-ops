import api from './axios'

export const registerUser = (data) => api.post('/auth/register', data)

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password })
}

export const loginStaff = (staff_id, email, password) => {
  return api.post('/auth/staff-login', { staff_id, email, password })
}

export const getMe = () => api.get('/auth/me', { _skipAuthRedirect: true })

export const logoutUser = () => api.post('/auth/logout')

export const demoLoginUser = () => api.post('/auth/demo-login')
