import api from './axios'

export const getOnboardingStatus = () => api.get('/onboarding/status')
export const activateWorkspace = () => api.post('/onboarding/activate')
