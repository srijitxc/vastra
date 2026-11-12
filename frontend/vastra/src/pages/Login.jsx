import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { user, loading, isConfigured, error, recoveryPending, signIn, resetPassword, updatePassword, clearError } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [notice, setNotice] = useState('')
  const routeError = location.state?.authError
  const isRecoveryFlow = recoveryPending || new URLSearchParams(location.search).get('mode') === 'recovery'

  useEffect(() => {
    if (!loading && user && !isRecoveryFlow) navigate('/', { replace: true })
  }, [loading, user, isRecoveryFlow, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    if (isRecoveryFlow && password !== confirmPassword) {
      setBusy(false)
      setNotice('The passwords do not match.')
      return
    }
    const result = isRecoveryFlow
      ? await updatePassword(password)
      : resetMode
        ? await resetPassword(email)
        : await signIn(email, password)
    setBusy(false)

    if (!result.ok) return
    if (isRecoveryFlow) {
      setNotice('Your password has been updated. You are now signed in.')
      navigate('/', { replace: true })
      return
    }
    if (resetMode) {
      setNotice('If an account exists for this email, a password reset link is on its way.')
      return
    }

    const destination = location.state?.from?.pathname || '/'
    navigate(destination, { replace: true })
  }

  return (
    <AuthShell
      eyebrow={isRecoveryFlow || resetMode ? 'Account recovery' : 'Welcome back'}
      title={isRecoveryFlow ? 'Choose a new password' : resetMode ? 'Reset your password' : 'Login to your account'}
      description={isRecoveryFlow
        ? 'Choose a new password for your Vastra account.'
        : resetMode
        ? 'We’ll email you a secure link to choose a new password.'
        : 'Keep your favourites close and pick up right where you left off.'}
    >
      {!isConfigured ? (
        <p role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Supabase URL is set, but the public anon/publishable key is missing. Add <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart Vite.
        </p>
      ) : null}
      {routeError || error ? (
        <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {routeError || error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}
      <form className="space-y-5" onSubmit={handleSubmit}>
        {!isRecoveryFlow ? <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-[#3A1410]">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setNotice('')
              clearError()
            }}
            className="w-full rounded-xl border border-[#D8B9A5] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
          />
        </div> : null}
        {!resetMode || isRecoveryFlow ? (
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-[#3A1410]">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete={isRecoveryFlow ? 'new-password' : 'current-password'}
              minLength={isRecoveryFlow ? 8 : undefined}
              placeholder={isRecoveryFlow ? 'At least 8 characters' : 'Enter your password'}
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                clearError()
              }}
              className="w-full rounded-xl border border-[#D8B9A5] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
            />
          </div>
        ) : null}
        {isRecoveryFlow ? (
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-[#3A1410]">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-[#D8B9A5] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy || loading}
          className="w-full rounded-full bg-[#3A1410] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#6B281B] disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'Please wait…' : isRecoveryFlow ? 'Update password' : resetMode ? 'Send reset link' : 'Login'}
        </button>
      </form>
      {!isRecoveryFlow ? <button
        type="button"
        onClick={() => {
          setResetMode((current) => !current)
          setNotice('')
          clearError()
        }}
        className="mt-4 text-sm font-bold text-[#9A3D25] hover:underline"
      >
        {resetMode ? 'Back to login' : 'Forgot password?'}
      </button> : null}
      {!isRecoveryFlow ? <p className="mt-7 text-center text-sm text-[#67483F]">
        New to Vastra?{' '}
        <Link to="/signup" className="font-bold text-[#9A3D25] hover:underline">Create an account</Link>
      </p> : null}
    </AuthShell>
  )
}

function AuthShell({ eyebrow, title, description, children }) {
  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#E8D8CA] bg-[#FFF9F2] shadow-[0_20px_60px_rgba(74,30,18,0.12)] md:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-between bg-[#3A1410] p-8 text-[#FFF9F2] md:p-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E8B58E]">Vastra</p>
          <h2 className="mt-16 max-w-xs text-4xl font-semibold leading-tight md:text-5xl">Style that feels like you.</h2>
        </div>
        <p className="mt-12 max-w-xs text-sm leading-6 text-[#E8D8CA]">Thoughtful pieces for every version of you.</p>
      </div>
      <div className="p-8 md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9A3D25]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#3A1410]">{title}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#67483F]">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}
