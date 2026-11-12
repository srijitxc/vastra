import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountAvatar from '../components/AccountAvatar'
import { useAuth } from '../context/useAuth'

export default function Profile() {
  const {
    user,
    loading,
    profile,
    profileLoading,
    profileError,
    updateProfile,
    uploadAvatar,
  } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true, state: { from: { pathname: '/profile' } } })
  }, [loading, user, navigate])

  async function handlePhotoChange(event) {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) return

    setPhotoBusy(true)
    setNotice('')
    const result = await uploadAvatar(file)
    setPhotoBusy(false)
    if (result.ok) setNotice('Your profile photo has been updated.')
  }

  if (loading || !user || (profileLoading && !profile)) {
    return <p role="status" className="mx-auto max-w-3xl rounded-2xl bg-[#FFF6EA] p-8 text-center font-medium text-[#3A1410]">Loading your profile…</p>
  }

  return (
    <section className="mx-auto max-w-4xl py-8 text-[#3A1410]" aria-labelledby="profile-title">
      <div className="rounded-[2rem] bg-[#FFF6EA] p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Your Vastra account</p>
        <h1 id="profile-title" className="mt-2 font-serif text-4xl font-extrabold tracking-tight sm:text-5xl">Your profile</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#3A1410]/75">
          Update the name your friends see and choose a photo for your account.
        </p>
      </div>

      {profileError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">
          <p className="font-bold">We couldn’t load or save your profile.</p>
          <p className="mt-1">{profileError}</p>
          <p className="mt-2">Make sure both Supabase profile migrations in the project README have been run.</p>
        </div>
      ) : null}
      {notice ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p> : null}

      <div className="mt-7 grid gap-7 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="flex flex-col items-center rounded-[1.75rem] border border-[#3A1410]/10 bg-[#FBE4DB] p-6 text-center">
          <AccountAvatar
            src={profile?.avatar_url}
            firstName={profile?.first_name || user.user_metadata?.first_name}
            lastName={profile?.last_name || user.user_metadata?.last_name}
            email={user.email}
            size="large"
          />
          <p className="mt-4 max-w-full truncate text-lg font-bold">
            {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email}
          </p>
          <p className="mt-1 max-w-full truncate text-xs text-[#3A1410]/65">{user.email}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            disabled={photoBusy || profileLoading || !profile}
            onClick={() => fileInput.current?.click()}
            className="mt-5 min-h-11 rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA] transition hover:bg-[#5a211b] disabled:cursor-wait disabled:opacity-60"
          >
            {photoBusy ? 'Please wait…' : 'Upload a photo'}
          </button>
          <p className="mt-3 text-xs leading-5 text-[#3A1410]/65">JPG, PNG, or WebP. Maximum 2 MB.</p>
        </aside>

        {profile ? (
          <ProfileDetailsForm
            key={profile.id}
            profile={profile}
            email={user.email || ''}
            profileLoading={profileLoading}
            updateProfile={updateProfile}
            onSaved={() => setNotice('Your profile has been saved.')}
            onChange={() => setNotice('')}
          />
        ) : (
          <div className="rounded-[1.75rem] border border-[#3A1410]/10 bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-bold">Profile setup needed</h2>
            <p className="mt-3 text-sm leading-6 text-[#3A1410]/70">
              Run both Supabase migrations listed in the README, then refresh this page to create your profile record.
            </p>
            <Link to="/group-cart" className="mt-5 inline-flex min-h-12 items-center text-sm font-semibold text-[#9A3D25] underline underline-offset-4">
              Go to group cart
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function ProfileDetailsForm({ profile, email, profileLoading, updateProfile, onSaved, onChange }) {
  const [firstName, setFirstName] = useState(profile.first_name || '')
  const [lastName, setLastName] = useState(profile.last_name || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await updateProfile({ firstName, lastName })
    setBusy(false)
    if (result.ok) onSaved()
    else setError(result.error)
  }

  return (
    <form onSubmit={handleSave} className="rounded-[1.75rem] border border-[#3A1410]/10 bg-white p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-bold">Personal details</h2>
      <p className="mt-2 text-sm leading-6 text-[#3A1410]/70">Your email is managed securely by Supabase Authentication.</p>
      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p> : null}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold" htmlFor="profile-first-name">
          First name
          <input
            id="profile-first-name"
            autoComplete="given-name"
            maxLength={60}
            required
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value)
              setError('')
              onChange()
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-[#FFFDF9] px-3 font-normal outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
          />
        </label>
        <label className="block text-sm font-semibold" htmlFor="profile-last-name">
          Last name
          <input
            id="profile-last-name"
            autoComplete="family-name"
            maxLength={60}
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value)
              setError('')
              onChange()
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-[#FFFDF9] px-3 font-normal outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
          />
        </label>
      </div>
      <label className="mt-5 block text-sm font-semibold" htmlFor="profile-email">
        Email address
        <input id="profile-email" type="email" value={email} readOnly className="mt-2 min-h-12 w-full cursor-not-allowed rounded-xl border border-[#3A1410]/10 bg-[#F7F4F0] px-3 font-normal text-[#3A1410]/65" />
      </label>
      <button
        type="submit"
        disabled={busy || profileLoading}
        className="mt-7 min-h-12 rounded-full bg-[#F7A81B] px-7 text-sm font-bold text-[#3A1410] transition hover:bg-[#f5b83d] disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>
      <Link to="/group-cart" className="ml-4 inline-flex min-h-12 items-center text-sm font-semibold text-[#9A3D25] underline underline-offset-4">
        Go to group cart
      </Link>
    </form>
  )
}
