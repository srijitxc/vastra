import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Signup() {
  const { isConfigured, error, signUp, clearError } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    const result = await signUp({ email, password, firstName, lastName })
    setBusy(false)

    if (!result.ok) return
    if (result.needsEmailConfirmation) {
      setNotice('Account created. Check your email and confirm your address before logging in.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#E8D8CA] bg-[#FFF9F2] shadow-[0_20px_60px_rgba(74,30,18,0.12)] md:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-between bg-[#3A1410] p-8 text-[#FFF9F2] md:p-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E8B58E]">Vastra</p>
          <h2 className="mt-16 max-w-xs text-4xl font-semibold leading-tight md:text-5xl">Your wardrobe, made personal.</h2>
        </div>
        <p className="mt-12 max-w-xs text-sm leading-6 text-[#E8D8CA]">Join a community that celebrates your everyday style.</p>
      </div>
      <div className="p-8 md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9A3D25]">Get started</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#3A1410]">Create your account</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#67483F]">Save your favourites, discover new pieces, and shop your way.</p>
        {!isConfigured ? (
          <p role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Supabase URL is set, but the public anon/publishable key is missing. Add <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart Vite.
          </p>
        ) : null}
        {error ? <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p> : null}
        {notice ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p> : null}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="first-name" label="First name" type="text" autoComplete="given-name" placeholder="Your first name" value={firstName} onChange={(value) => { setFirstName(value); clearError() }} />
            <FormField id="last-name" label="Last name" type="text" autoComplete="family-name" placeholder="Your last name" value={lastName} onChange={(value) => { setLastName(value); clearError() }} />
          </div>
          <FormField id="signup-email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(value) => { setEmail(value); clearError() }} />
          <FormField id="signup-password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={(value) => { setPassword(value); clearError() }} />
          <label className="flex items-start gap-3 text-xs leading-5 text-[#67483F]">
            <input type="checkbox" required className="mt-1 accent-[#9A3D25]" />
            <span>I agree to the terms and understand the privacy policy.</span>
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-full bg-[#3A1410] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#6B281B] disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-[#67483F]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#9A3D25] hover:underline">Login</Link>
        </p>
      </div>
    </section>
  )
}

function FormField({ id, label, type, autoComplete, placeholder, value, onChange, minLength }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-[#3A1410]">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#D8B9A5] bg-[#FFFDF9] px-4 py-3 text-sm outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
      />
    </div>
  )
}
