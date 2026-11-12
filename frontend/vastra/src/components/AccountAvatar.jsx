import { useState } from 'react'

function initialsFor(firstName, lastName, email) {
  const initials = `${firstName?.trim().charAt(0) || ''}${lastName?.trim().charAt(0) || ''}`
  return initials || email?.trim().charAt(0).toUpperCase() || '?'
}

export default function AccountAvatar({ src, firstName, lastName, email, size = 'small' }) {
  const [failedSrc, setFailedSrc] = useState('')
  const imageFailed = failedSrc === src
  const diameter = size === 'large' ? 'h-28 w-28 text-3xl' : 'h-10 w-10 text-sm'

  return src && !imageFailed ? (
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={`${diameter} shrink-0 rounded-full border-2 border-[#3A1410]/15 bg-white object-cover`}
    />
  ) : (
    <span aria-hidden="true" className={`${diameter} grid shrink-0 place-items-center rounded-full border-2 border-[#3A1410]/15 bg-[#F7A81B] font-bold text-[#3A1410]`}>
      {initialsFor(firstName, lastName, email)}
    </span>
  )
}
