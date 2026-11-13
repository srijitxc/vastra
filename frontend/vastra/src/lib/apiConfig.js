function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_GROUP_CART_API_URL?.trim()
  if (!envUrl) return '/api'

  const trimmed = envUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const API_BASE_URL = resolveApiBaseUrl()
