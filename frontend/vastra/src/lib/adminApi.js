const API_BASE_URL = import.meta.env.VITE_GROUP_CART_API_URL || '/api'
const ADMIN_TOKEN_KEY = 'vastra:admin-token'

export function hasAdminSession() {
  return Boolean(window.sessionStorage.getItem(ADMIN_TOKEN_KEY))
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function adminRequest(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Could not reach the admin server. Check that the backend is running and try again.')
  }

  const text = await response.text()
  let result = {}
  if (text) {
    try {
      result = JSON.parse(text)
    } catch {
      if (response.ok) throw new Error('The server returned an invalid admin response.')
    }
  }
  if (!response.ok) {
    if (response.status === 401) clearAdminSession()
    throw new Error(result.error || `Admin request failed (HTTP ${response.status}).`)
  }
  return result
}

export async function adminLogin(email, password) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error('Could not reach the admin server. Check that the backend is running and try again.')
  }
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || `Admin login failed (HTTP ${response.status}).`)
  if (typeof result.token !== 'string' || !result.token) throw new Error('The server did not create an admin session.')
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token)
}
