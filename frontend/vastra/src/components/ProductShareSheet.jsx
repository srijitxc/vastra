import { useEffect, useRef, useState } from 'react'

function ShareIcon({ type }) {
  const paths = {
    group: <><path d="M3 8h18l-1.5 12h-15L3 8Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /><path d="M8 14h8" /></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" /></>,
    whatsapp: <><path d="M20.2 11.6a8.3 8.3 0 0 1-12.3 7.3L3 20l1.2-4.7a8.3 8.3 0 1 1 16-3.7Z" /><path d="M8.2 8.1c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .6l-.6.8c-.2.2-.2.4 0 .6.4.7 1.1 1.4 1.9 1.8.2.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.6-.5.4-1.1.6-1.8.4-1-.2-2.2-.7-3.5-1.9-1.3-1.1-2.1-2.5-2.4-3.5-.3-.9 0-1.6.5-2.2Z" /></>,
    facebook: <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" fill="currentColor" stroke="none" />,
    telegram: <><path d="m22 3-7 18-4-7-7-4 18-7Z" /><path d="m11 14 5-5" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      {paths[type]}
    </svg>
  )
}

export default function ProductShareSheet({ product, onClose, onShareToGroup }) {
  const [message, setMessage] = useState('')
  const closeButtonRef = useRef(null)
  const shareUrl = `${window.location.origin}/products?product=${encodeURIComponent(product.id)}`
  const shareText = `Check out ${product.name}: ${shareUrl}`

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const input = document.createElement('textarea')
        input.value = shareUrl
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.append(input)
        input.select()
        const copied = document.execCommand('copy')
        input.remove()
        if (!copied) throw new Error('Clipboard copy was not available')
      }
      setMessage('Product link copied.')
    } catch {
      setMessage('Could not copy the link. You can select and copy it below.')
    }
  }

  async function shareWithDevice() {
    try {
      await navigator.share({ title: product.name, text: `Check out ${product.name}`, url: shareUrl })
    } catch (error) {
      if (error.name !== 'AbortError') setMessage('Could not open the share options. Please choose another method.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-share-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#FFF6EA] p-6 text-[#3A1410] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={product.image}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
              style={{ objectPosition: product.imagePosition }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A3D25]">Share product</p>
              <h2 id="product-share-title" className="mt-1 truncate font-semibold">{product.name}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close sharing options"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-x-2 gap-y-4">
          <button
            type="button"
            onClick={() => {
              onClose()
              onShareToGroup(product)
            }}
            className="flex flex-col items-center gap-2 text-center text-xs font-semibold"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#3A1410] text-white shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="group" />
            </span>
            <span>Group cart</span>
          </button>
          <button type="button" onClick={copyLink} className="flex flex-col items-center gap-2 text-center text-xs font-semibold">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[#3A1410]/10 bg-white text-[#3A1410] shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="copy" />
            </span>
            <span>Copy link</span>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on WhatsApp"
            className="flex flex-col items-center gap-2 text-center text-xs font-semibold"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="whatsapp" />
            </span>
            <span>WhatsApp</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Facebook"
            className="flex flex-col items-center gap-2 text-center text-xs font-semibold"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#1877F2] text-white shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="facebook" />
            </span>
            <span>Facebook</span>
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${product.name}`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Telegram"
            className="flex flex-col items-center gap-2 text-center text-xs font-semibold"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#229ED9] text-white shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="telegram" />
            </span>
            <span>Telegram</span>
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Check out ${product.name}`)}&body=${encodeURIComponent(shareText)}`}
            className="flex flex-col items-center gap-2 text-center text-xs font-semibold"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[#3A1410]/10 bg-white text-[#3A1410] shadow-sm transition-transform hover:scale-105">
              <ShareIcon type="email" />
            </span>
            <span>Email</span>
          </a>
          {typeof navigator.share === 'function' ? (
            <button type="button" onClick={shareWithDevice} className="flex flex-col items-center gap-2 text-center text-xs font-semibold">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[#3A1410]/10 bg-white text-[#3A1410] shadow-sm transition-transform hover:scale-105">
                <ShareIcon type="more" />
              </span>
              <span>More</span>
            </button>
          ) : null}
        </div>

        <label htmlFor="product-share-link" className="mt-5 block text-xs font-semibold text-[#3A1410]/70">
          Product link
        </label>
        <input
          id="product-share-link"
          type="text"
          readOnly
          value={shareUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-2 min-h-11 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-xs text-[#3A1410]"
        />
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm font-medium text-[#065f46]">{message}</p>
      </section>
    </div>
  )
}
