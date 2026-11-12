import { useCallback, useEffect, useMemo, useState } from 'react'
import { GroupCartContext } from './groupCartStore'

const STORAGE_KEY = 'vastra:active-group'
const API_BASE_URL = import.meta.env.VITE_GROUP_CART_API_URL || '/api'

function readActiveGroup() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    return stored && typeof stored.inviteCode === 'string' ? stored : null
  } catch {
    return null
  }
}

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
  } catch {
    throw new Error('Could not reach the group cart server. Check that the backend is running.')
  }

  const responseText = await response.text()
  let body = {}
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      if (response.ok) throw new Error('The group cart server returned an invalid response.')
    }
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503) {
      throw new Error('Group cart API is offline. In a separate terminal run: Set-Location D:\\2\\Ecorweb\\backend; npm run dev')
    }
    throw new Error(body.error || `The group cart request failed (HTTP ${response.status}).`)
  }
  return body
}

export function GroupCartProvider({ children }) {
  const [activeGroup, setActiveGroup] = useState(readActiveGroup)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(Boolean(readActiveGroup()?.inviteCode))
  const [error, setError] = useState('')

  const refreshGroup = useCallback(async (inviteCode = activeGroup?.inviteCode) => {
    if (!inviteCode) {
      setGroup(null)
      return null
    }

    const result = await request(`/groups/${encodeURIComponent(inviteCode)}`)
    setGroup(result.group)
    return result.group
  }, [activeGroup?.inviteCode])

  const retryGroupLoad = useCallback(async () => {
    setLoading(true)
    try {
      await refreshGroup()
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [refreshGroup])

  useEffect(() => {
    if (!activeGroup?.inviteCode) return undefined

    let cancelled = false
    request(`/groups/${encodeURIComponent(activeGroup.inviteCode)}`)
      .then(({ group: loadedGroup }) => {
        if (!cancelled) {
          setGroup(loadedGroup)
          setError('')
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeGroup?.inviteCode])

  const activateGroup = useCallback((newGroup, memberName) => {
    const nextActiveGroup = {
      inviteCode: newGroup.inviteCode,
      name: newGroup.name,
      memberName,
    }
    setLoading(true)
    setActiveGroup(nextActiveGroup)
    setGroup(newGroup)
    setError('')
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextActiveGroup))
    } catch {
      setError('This browser could not remember your group. Keep the invite code to rejoin later.')
    }
  }, [])

  const createGroup = useCallback(async ({ name, memberName }) => {
    try {
      const { group: newGroup } = await request('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, memberName }),
      })
      activateGroup(newGroup, memberName.trim())
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }, [activateGroup])

  const joinGroup = useCallback(async ({ inviteCode, memberName }) => {
    try {
      const { group: joinedGroup } = await request('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode, memberName }),
      })
      activateGroup(joinedGroup, memberName.trim())
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }, [activateGroup])

  const addToGroupCart = useCallback(async (product, details = {}) => {
    if (!activeGroup) {
      setError('Create or join a group before sharing a product.')
      return false
    }
    try {
      await request(`/groups/${encodeURIComponent(activeGroup.inviteCode)}/items`, {
        method: 'POST',
        body: JSON.stringify({
          product,
          sharedBy: details.sharedBy?.trim() || activeGroup.memberName,
          status: details.status || 'like',
          note: details.note?.trim() || '',
        }),
      })
      await refreshGroup(activeGroup.inviteCode)
      setError('')
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }, [activeGroup, refreshGroup])

  const updateGroupItem = useCallback(async (entryId, changes) => {
    if (!activeGroup || !['like', 'bought'].includes(changes.status)) return false
    try {
      await request(`/groups/${encodeURIComponent(activeGroup.inviteCode)}/items/${encodeURIComponent(entryId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: changes.status }),
      })
      await refreshGroup(activeGroup.inviteCode)
      setError('')
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }, [activeGroup, refreshGroup])

  const removeFromGroupCart = useCallback(async (entryId) => {
    if (!activeGroup) return false
    try {
      await request(`/groups/${encodeURIComponent(activeGroup.inviteCode)}/items/${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
      })
      await refreshGroup(activeGroup.inviteCode)
      setError('')
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }, [activeGroup, refreshGroup])

  const leaveGroup = useCallback(() => {
    setActiveGroup(null)
    setGroup(null)
    setLoading(false)
    setError('')
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      setError('Could not clear the saved group from this browser.')
    }
  }, [])

  const clearError = useCallback(() => setError(''), [])

  const value = useMemo(() => ({
    activeGroup,
    group,
    items: group?.items || [],
    loading,
    error,
    createGroup,
    joinGroup,
    addToGroupCart,
    updateGroupItem,
    removeFromGroupCart,
    leaveGroup,
    refreshGroup,
    retryGroupLoad,
    clearError,
  }), [
    activeGroup,
    group,
    loading,
    error,
    createGroup,
    joinGroup,
    addToGroupCart,
    updateGroupItem,
    removeFromGroupCart,
    leaveGroup,
    refreshGroup,
    retryGroupLoad,
    clearError,
  ])

  return <GroupCartContext.Provider value={value}>{children}</GroupCartContext.Provider>
}
