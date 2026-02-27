import api from './axios'

export const getRules = async () => {
  const res = await api.get('/automation/rules')
  return res.data
}

export const getMetrics = async () => {
  const res = await api.get('/automation/metrics')
  return res.data
}

export const getEngineStatus = async () => {
  const res = await api.get('/automation/engine-status')
  return res.data
}

export const getFailures = async () => {
  const res = await api.get('/automation/failures')
  return res.data
}

export const toggleRule = async (ruleKey, enabled) => {
  const res = await api.patch(`/automation/rules/${ruleKey}/toggle`, { enabled })
  return res.data
}

export const getFeatures = async () => {
  const res = await api.get('/automation/features')
  return res.data
}

export const toggleFeature = async (featureKey, enabled) => {
  const res = await api.patch(`/automation/features/${featureKey}/toggle`, { enabled })
  return res.data
}
