import api from './axios'

export const getIntegrationHealth = async () => {
  const response = await api.get('/integrations/health')
  return response.data
}
