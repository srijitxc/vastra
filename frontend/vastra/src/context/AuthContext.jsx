import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authStore'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const missingConfigMessage = 'Supabase URL is set, but the public anon/publishable key is missing. Add VITE_SUPABASE_ANON_KEY to frontend/vastra/.env.local, then restart Vite.'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [recoveryPending, setRecoveryPending] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const userId = session?.user?.id

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return
        if (sessionError) setError(sessionError.message)
        else setSession(data.session)
        setLoading(false)
      })
      .catch((sessionError) => {
        if (active) {
          setError(sessionError.message || 'Could not load your sign-in session.')
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      setRecoveryPending(event === 'PASSWORD_RECOVERY')
      if (!nextSession) {
        setProfile(null)
        setProfileLoading(false)
        setProfileError('')
      }
      setError('')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId || !supabase) return undefined

    let active = true
    // oxlint-disable-next-line react/set-state-in-effect
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) {
          setProfileError(queryError.message)
          setProfile(null)
        } else {
          setProfile(data)
          setProfileError(data ? '' : 'Profile not found. Run the Supabase profile migrations from the project README.')
        }
      })
      .catch((queryError) => {
        if (active) setProfileError(queryError.message || 'Could not load your profile.')
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      setError(missingConfigMessage)
      return { ok: false, error: missingConfigMessage }
    }
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      setError('')
      return { ok: true }
    } catch (authError) {
      const message = authError.message || 'Could not sign in. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const signUp = useCallback(async ({ email, password, firstName, lastName }) => {
    if (!supabase) {
      setError(missingConfigMessage)
      return { ok: false, error: missingConfigMessage }
    }
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      })
      if (authError) throw authError
      setError('')
      return { ok: true, needsEmailConfirmation: !data.session }
    } catch (authError) {
      const message = authError.message || 'Could not create your account. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!supabase) {
      setError(missingConfigMessage)
      return { ok: false, error: missingConfigMessage }
    }
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?mode=recovery`,
      })
      if (authError) throw authError
      setError('')
      return { ok: true }
    } catch (authError) {
      const message = authError.message || 'Could not send the password reset email.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) {
      setError(missingConfigMessage)
      return { ok: false, error: missingConfigMessage }
    }
    try {
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw authError
      setRecoveryPending(false)
      setError('')
      return { ok: true }
    } catch (authError) {
      const message = authError.message || 'Could not update your password. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const updateProfile = useCallback(async ({ firstName, lastName }) => {
    if (!supabase || !userId) {
      const message = 'Sign in before updating your profile.'
      setProfileError(message)
      return { ok: false, error: message }
    }
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        .eq('id', userId)
        .select('id, first_name, last_name, avatar_url')
        .single()
      if (updateError) throw updateError
      setProfile(data)
      setProfileError('')
      return { ok: true }
    } catch (updateError) {
      const message = updateError.message || 'Could not save your profile.'
      setProfileError(message)
      return { ok: false, error: message }
    }
  }, [userId])

  const uploadAvatar = useCallback(async (file) => {
    if (!supabase || !userId) {
      const message = 'Sign in before uploading a profile photo.'
      setProfileError(message)
      return { ok: false, error: message }
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      const message = 'Choose a JPG, PNG, or WebP image.'
      setProfileError(message)
      return { ok: false, error: message }
    }
    if (file.size > 2 * 1024 * 1024) {
      const message = 'Profile photos must be 2 MB or smaller.'
      setProfileError(message)
      return { ok: false, error: message }
    }

    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `${userId}/avatar.${extension}`
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true,
        })
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from('profile-avatars').getPublicUrl(path)
      const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select('id, first_name, last_name, avatar_url')
        .single()
      if (updateError) throw updateError
      setProfile(data)
      setProfileError('')
      return { ok: true }
    } catch (uploadError) {
      const message = uploadError.message || 'Could not upload your profile photo.'
      setProfileError(message)
      return { ok: false, error: message }
    }
  }, [userId])

  const signOut = useCallback(async () => {
    if (!supabase) {
      setError(missingConfigMessage)
      return { ok: false, error: missingConfigMessage }
    }
    try {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      setProfile(null)
      setProfileError('')
      setError('')
      return { ok: true }
    } catch (authError) {
      const message = authError.message || 'Could not sign out. Please try again.'
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const clearError = useCallback(() => setError(''), [])
  const currentProfile = profile?.id === userId ? profile : null
  const value = useMemo(() => ({
    user: session?.user || null,
    session,
    loading,
    error,
    recoveryPending,
    profile: currentProfile,
    profileLoading,
    profileError,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    signOut,
    clearError,
  }), [
    session,
    loading,
    error,
    recoveryPending,
    currentProfile,
    profileLoading,
    profileError,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    signOut,
    clearError,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
