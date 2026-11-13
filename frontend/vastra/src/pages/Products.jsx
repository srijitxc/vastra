import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useGroupCart } from '../context/useGroupCart'
import { sections as SECTIONS, categories } from '../data/catalog'
import { useCatalog } from '../context/useCatalog'
import pro2 from '../assets/products/pro2.jpg'
import pro3 from '../assets/products/pro3.jpg'
import pro4 from '../assets/products/pro4.jpg'
import pos2 from '../assets/posters/pos2.jpg'
import springCampaign from '../assets/posters/Blooming into spring, one cute outfit at a time___[Khaadi, Wear Yourself, Ready To Wear].jpg'
import hoodieCampaign from '../assets/posters/Creative Hoodie Ad Manipulation _ Social Media Design Idea.jpg'
import winterCampaign from '../assets/posters/Stay Warm, Stay You _ Premium Winter Collection Advertising Design.jpg'
import ProductShareSheet from '../components/ProductShareSheet'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const MIN_PRICE = 500
const MAX_PRICE = 3500
const SIZE_SCALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const WISHLIST_KEY = 'vastra:wishlist'

// Soft card colours, picked from the product ID so they remain stable while filtering.
const CARD_TONES = ['#FFD6D9', '#FFE7A3', '#E5DAF8', '#FBE1D6']

function matchesCategory(product, category) {
  return category === 'New arrivals' ? product.badge === 'New' : product.category === category
}

// Each tile of the hero is its own carousel. `action` is the filter applied when the slide is clicked.
const HERO_TILES = [
  {
    key: 'main',
    label: 'Featured collection posters',
    interval: 5400,
    slides: [
      { image: springCampaign, pos: 'center 35%', action: { category: 'Festive edit' } },
      { image: hoodieCampaign, pos: 'center 42%', action: {} },
      { image: winterCampaign, pos: 'center 48%', action: { category: 'New arrivals' } },
      { image: pos2, pos: 'center 48%', action: { section: 'Accessories' } },
    ],
  },
  {
    key: 'wide',
    label: 'New arrivals photos',
    interval: 4300,
    slides: [
      { image: winterCampaign, pos: 'center 48%', action: { category: 'New arrivals' } },
      { image: hoodieCampaign, pos: 'center 48%', action: { category: 'New arrivals' } },
      { image: springCampaign, pos: 'center 35%', action: { section: 'Women' } },
    ],
  },
  {
    key: 'dresses',
    label: 'Dresses photos',
    interval: 6100,
    slides: [
      { image: pro3, pos: 'center 40%', action: { category: 'Dresses' } },
      { image: pro3, pos: 'center 25%', action: { section: 'Kids' } },
    ],
  },
  {
    key: 'tops',
    label: 'Tops photos',
    interval: 4900,
    slides: [
      { image: pro4, pos: 'center 44%', action: { category: 'Tops' } },
      { image: pro2, pos: 'center 62%', action: { section: 'Men' } },
    ],
  },
]

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// "S–XL" -> ['S', 'M', 'L', 'XL']. One-size items return [] so no size has to be picked.
function getSizeOptions(range) {
  if (String(range).includes(',')) {
    return String(range).split(',').map((part) => part.trim()).filter(Boolean)
  }
  const [from, to] = String(range).split(/[–-]/).map((part) => part.trim())
  const start = SIZE_SCALE.indexOf(from)
  const end = SIZE_SCALE.indexOf(to)
  if (start === -1 || end === -1 || end < start) return []
  return SIZE_SCALE.slice(start, end + 1)
}

function sizeLabel(range) {
  return getSizeOptions(range).length > 0 ? `Sizes ${range}` : range
}

function readProductReviews(productId) {
  try {
    const saved = window.localStorage.getItem(`vastra:reviews:${productId}`)
    if (!saved) return { reviews: [], error: '' }
    const reviews = JSON.parse(saved)
    if (!Array.isArray(reviews)) throw new Error('Invalid review data')
    const validReviews = reviews.filter(
      (review) =>
        review &&
        typeof review.id === 'string' &&
        typeof review.name === 'string' &&
        Number.isInteger(review.rating) &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        typeof review.text === 'string' &&
        typeof review.createdAt === 'string' &&
        Number.isFinite(Date.parse(review.createdAt)),
    )
    return {
      reviews: validReviews,
      error: validReviews.length === reviews.length ? '' : 'Some saved reviews could not be displayed.',
    }
  } catch {
    return { reviews: [], error: 'Reviews could not be loaded from this browser.' }
  }
}

function readWishlist() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function toneFor(product) {
  const hash = Array.from(String(product.id)).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
  return CARD_TONES[hash % CARD_TONES.length]
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/*                                                                     */
/* Same visual language as Home and the navbar: cream paper, maroon    */
/* ink, gulabi, marigold, lilac. Motion: transform + opacity only,     */
/* hover gated to real pointers, reduced motion drops the movement.    */
/* ------------------------------------------------------------------ */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,800&display=swap');
body{overflow-x:clip}
.vx-root{
  --ink:#3A1410;--cream:#FFF6EA;
  --vx-ease-out:cubic-bezier(0.23,1,0.32,1);
  --vx-ease-in-out:cubic-bezier(0.77,0,0.175,1);
  --vx-ease-drawer:cubic-bezier(0.32,0.72,0,1);
  position:relative;isolation:isolate;font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);
  -webkit-tap-highlight-color:transparent;
}
.vx-root::before{content:'';position:absolute;z-index:-1;top:-2.5rem;bottom:-2.5rem;left:calc(50% - 50vw);right:calc(50% - 50vw);background:var(--cream)}
.vx-display{font-family:'Fraunces',Georgia,serif;font-optical-sizing:auto}
.vx-root :focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.vx-dark :focus-visible,.vx-slider :focus-visible{outline-color:var(--cream)}
.vx-root button,.vx-root select,.vx-root summary,.vx-root a{touch-action:manipulation}
.vx-root button{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
@media (pointer:coarse){.vx-root input,.vx-root select{font-size:16px}}
.vx-noscroll{scrollbar-width:none}
.vx-noscroll::-webkit-scrollbar{display:none}
.vx-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.vx-dialog-open{overflow:hidden}

.vx-press{transition:transform 160ms var(--vx-ease-out),background-color 160ms ease,color 160ms ease,border-color 160ms ease,box-shadow 160ms ease,opacity 160ms ease}
.vx-press:active{transform:scale(0.97)}
.vx-press[data-added="true"]{background-color:#065f46;color:#fff}

/* Hero carousels */
.vx-track{transition:transform 800ms var(--vx-ease-in-out)}
.vx-slide[data-active="true"] .vx-slide-img{animation:vx-drift 7s var(--vx-ease-out) forwards}
@keyframes vx-drift{from{transform:scale(1.09)}to{transform:scale(1)}}
.vx-dot{transition:width 300ms var(--vx-ease-out),background-color 200ms ease}
.vx-caption{transition:opacity 500ms ease 250ms,transform 500ms var(--vx-ease-out) 250ms;opacity:0;transform:translateY(12px)}
.vx-slide[data-active="true"] .vx-caption{opacity:1;transform:none}

/* Section pills */
.vx-pill{transition:transform 200ms var(--vx-ease-out),background-color 200ms ease,color 200ms ease,box-shadow 200ms ease}

/* Product card */
.vx-card{
  transition:transform 240ms var(--vx-ease-out),box-shadow 240ms var(--vx-ease-out);
  animation:vx-rise 360ms var(--vx-ease-out) backwards;
  animation-delay:calc(var(--i,0) * 35ms);
}
.vx-card-img{opacity:0;transition:opacity 400ms ease,transform 500ms var(--vx-ease-out)}
.vx-card-img[data-loaded="true"]{opacity:1}
.vx-card-cta{opacity:0;transform:translateY(100%);transition:opacity 200ms var(--vx-ease-out),transform 240ms var(--vx-ease-out)}
.vx-card-open:focus-visible .vx-card-cta{opacity:1;transform:none}
.vx-heart[aria-pressed="true"] svg{animation:vx-pop 260ms var(--vx-ease-out)}
@keyframes vx-rise{from{opacity:0;transform:translateY(10px)}}
@keyframes vx-pop{0%{transform:scale(0.8)}60%{transform:scale(1.18)}100%{transform:scale(1)}}
.vx-enter{animation:vx-rise 300ms var(--vx-ease-out) backwards}

/* Tilted promise cards (tablet and up) */
@media (min-width:768px){
  .vx-tilt{rotate:var(--r,0deg);transition:rotate 300ms var(--vx-ease-out),translate 300ms var(--vx-ease-out)}
}

/* Collapsible filter panel */
.vx-fold{display:grid;grid-template-rows:0fr;transition:grid-template-rows 260ms var(--vx-ease-out)}
.vx-fold[data-open="true"]{grid-template-rows:1fr}
.vx-fold>*{min-height:0;overflow:hidden;visibility:hidden;transition:visibility 0s linear 260ms}
.vx-fold[data-open="true"]>*{visibility:visible;transition-delay:0s}

/* Price slider */
.vx-range{-webkit-appearance:none;appearance:none;width:100%;height:22px;background:transparent;margin:0;cursor:pointer}
.vx-range::-webkit-slider-runnable-track{height:6px;border-radius:9999px;background:linear-gradient(to right,#E2362B var(--pct),#fff var(--pct))}
.vx-range::-moz-range-track{height:6px;border-radius:9999px;background:linear-gradient(to right,#E2362B var(--pct),#fff var(--pct))}
.vx-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-8px;border-radius:9999px;background:#fff;border:3px solid var(--ink);box-shadow:0 1px 4px rgb(58 20 16 / 0.3);transition:transform 160ms var(--vx-ease-out)}
.vx-range::-moz-range-thumb{width:18px;height:18px;border-radius:9999px;background:#fff;border:3px solid var(--ink);box-shadow:0 1px 4px rgb(58 20 16 / 0.3);transition:transform 160ms var(--vx-ease-out)}
.vx-range:active::-webkit-slider-thumb{transform:scale(1.12)}
.vx-range:active::-moz-range-thumb{transform:scale(1.12)}

/* Label crossfade */
.vx-swap{display:grid;place-items:center}
.vx-swap-item{grid-area:1/1;display:inline-flex;align-items:center;gap:0.5rem;transition:opacity 200ms ease,filter 200ms ease,transform 200ms var(--vx-ease-out)}
.vx-swap-item[data-on="false"]{opacity:0;filter:blur(3px);transform:translateY(6px) scale(0.92)}

/* Toast */
.vx-toast-card{opacity:0;transform:translateY(16px);transition:opacity 300ms ease,transform 300ms ease}
.vx-toast[data-visible="true"] .vx-toast-card{opacity:1;transform:none}

/* Quick view: native <dialog> (focus trap, Esc and top layer for free) */
.vx-dialog{
  margin:auto;padding:0;border:0;background:transparent;color:inherit;
  width:min(56rem,calc(100vw - 2rem));max-width:none;max-height:none;overflow:visible;
  opacity:0;transform:scale(0.96);
  transition:opacity 220ms var(--vx-ease-out),transform 220ms var(--vx-ease-out);
}
.vx-dialog[open]{opacity:1;transform:none}
.vx-dialog::backdrop{background:rgb(58 20 16 / 0.6);opacity:0;transition:opacity 220ms var(--vx-ease-out)}
.vx-dialog[open]::backdrop{opacity:1}
.vx-sheet{max-height:calc(100vh - 2rem);max-height:calc(100dvh - 2rem);overflow-y:auto;overscroll-behavior:contain}
@media (max-width:639px){
  .vx-dialog{margin:auto 0 0;width:100%;transform:translateY(100%);transition-duration:400ms;transition-timing-function:var(--vx-ease-drawer)}
  .vx-dialog[open]{transform:none}
  .vx-sheet{max-height:92vh;max-height:92dvh;border-radius:1.5rem 1.5rem 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}
}

@media (hover:hover) and (pointer:fine){
  .vx-hover-green:hover{background-color:#065f46;color:#fff}
  .vx-hover-ink:hover{background-color:var(--ink);color:var(--cream)}
  .vx-hover-line:hover{border-color:var(--ink)}
  .vx-hover-soft:hover{background-color:#fff}
  .vx-hover-underline:hover{text-decoration-line:underline}
  .vx-card:hover{box-shadow:0 22px 40px -22px rgb(58 20 16 / 0.45)}
  .vx-card:hover .vx-card-cta{opacity:1;transform:none}
}
@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){
  .vx-card:hover{transform:translateY(-4px)}
  .vx-card:hover .vx-card-img{transform:scale(1.045)}
  .vx-pill:hover{transform:translateY(-3px)}
  .vx-tilt:hover{rotate:0deg;translate:0 -6px}
}

@media (prefers-reduced-motion:reduce){
  .vx-track{transition-duration:1ms}
  .vx-slide[data-active="true"] .vx-slide-img{animation:none}
  .vx-caption{transform:none}
  .vx-card,.vx-enter{animation:none}
  .vx-heart[aria-pressed="true"] svg{animation:none}
  .vx-swap-item[data-on="false"]{transform:none}
  .vx-toast-card{transform:none}
  .vx-card-cta{transform:none}
  .vx-dialog{transform:none}
}
`

/* ------------------------------------------------------------------ */
/* Small hooks + helpers                                               */
/* ------------------------------------------------------------------ */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )

  useEffect(() => {
    if (!window.matchMedia) return undefined
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function SwapLabel({ active, idle, done }) {
  return (
    <span className="vx-swap">
      <span className="vx-swap-item" data-on={!active} aria-hidden={active}>
        {idle}
      </span>
      <span className="vx-swap-item" data-on={active} aria-hidden={!active}>
        {done}
      </span>
    </span>
  )
}

function Heading({ bold, light, className = '' }) {
  return (
    <h2 className={`vx-display leading-[1.02] text-[#3A1410] ${className}`}>
      <span className="block font-extrabold">{bold}</span>
      <span className="block font-normal">{light}</span>
    </h2>
  )
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.7Z" strokeLinejoin="round" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

function CloseIcon({ small = false }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={small ? 'h-3.5 w-3.5' : 'h-5 w-5'}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className="h-4 w-4">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Hero carousels                                                      */
/* ------------------------------------------------------------------ */

function Slider({ tile, reduced, onPick, className = '' }) {
  const { slides, interval, label } = tile
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const swipeStart = useRef(null)

  // Re-runs on every slide change, so tapping a dot restarts the timer
  useEffect(() => {
    if (reduced || paused || count < 2) return undefined
    const id = setTimeout(() => setIndex((current) => (current + 1) % count), interval)
    return () => clearTimeout(id)
  }, [reduced, paused, count, interval, index])

  const go = (target) => setIndex((target + count) % count)

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={`vx-slider relative overflow-hidden rounded-[2rem] bg-[#FBE4D2] ${className}`}
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(event) => {
        swipeStart.current = event.clientX
      }}
      onPointerUp={(event) => {
        if (swipeStart.current === null) return
        const distance = event.clientX - swipeStart.current
        swipeStart.current = null
        if (Math.abs(distance) > 50) go(index + (distance < 0 ? 1 : -1))
      }}
      onPointerCancel={() => {
        swipeStart.current = null
      }}
    >
      <div className="vx-track flex h-full" style={{ transform: `translateX(-${index * 100}%)` }} aria-live={paused || reduced ? 'polite' : 'off'}>
        {slides.map((slide, i) => {
          const active = i === index
          return (
            <div key={`${slide.image}-${i}`} data-active={active} aria-hidden={!active} className="vx-slide relative h-full w-full shrink-0 overflow-hidden">
              <img src={slide.image} alt="" draggable="false" className="vx-slide-img absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: slide.pos }} />
              <button
                type="button"
                tabIndex={active ? 0 : -1}
                onClick={() => onPick(slide.action)}
                aria-label={`Shop collection photo ${i + 1}`}
                className="absolute inset-0"
              />
            </div>
          )
        })}
      </div>

      {count > 1 ? (
        <div className="absolute right-2 top-3 z-10 flex sm:right-3 sm:top-4">
          {slides.map((slide, i) => (
            <button key={`${slide.image}-${i}`} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1} of ${count}`} aria-current={i === index} className="grid h-7 w-6 place-items-center">
              <span className={`vx-dot block h-2 rounded-full ${i === index ? 'w-6 bg-[#FFF6EA]' : 'w-2 bg-[#FFF6EA]/55'}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Product card                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({ product, index, isWishlisted, onToggleWishlist, onShare, onOpen }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) setLoaded(true)
  }, [])

  return (
    <article className="vx-card rounded-[2rem] p-3 pb-5" style={{ '--i': Math.min(index, 5), background: toneFor(product) }}>
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-white/60">
        <button type="button" onClick={() => onOpen(product)} aria-label={`Quick view: ${product.name}`} className="vx-card-open absolute inset-0 block h-full w-full">
          <img
            ref={imgRef}
            src={product.image}
            alt={product.imageAlt}
            loading="lazy"
            data-loaded={loaded}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className="vx-card-img h-full w-full object-cover"
            style={{ objectPosition: product.imagePosition }}
          />
          <span className="vx-card-cta absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 rounded-full bg-[#FFF6EA]/95 px-4 py-3 text-sm font-bold text-[#3A1410] shadow-lg backdrop-blur">
            Quick view
            <ArrowIcon />
          </span>
        </button>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {product.badge ? (
            <span className="max-w-[60%] -rotate-6 truncate rounded-md border-2 border-dashed border-[#3A1410]/70 bg-white/85 px-2.5 py-1 text-xs font-bold text-[#3A1410] backdrop-blur-sm">
              {product.badge}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-pressed={isWishlisted}
            aria-label={`${isWishlisted ? 'Remove' : 'Save'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist`}
            className={`vx-press vx-heart pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full ${isWishlisted ? 'bg-[#3A1410] text-[#FFB3B9]' : 'vx-hover-soft bg-white/90 text-[#3A1410]'}`}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        </div>
      </div>

      <div className="px-2 pt-4">
        <p className="truncate text-sm text-[#3A1410]/70">
          {product.section}, {product.category}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="vx-display vx-clamp2 text-xl font-bold leading-6 text-[#3A1410]">{product.name}</h3>
          <p className="shrink-0 rounded-full bg-[#3A1410] px-3 py-1 text-sm font-bold text-[#FFF6EA]">{currency.format(product.price)}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-[#3A1410]/70">{sizeLabel(product.sizes)}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShare(product)}
              aria-label={`Share ${product.name}`}
              className="vx-press vx-hover-line inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-2 border-[#3A1410]/25 bg-white px-3 text-xs font-bold text-[#3A1410]"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => onOpen(product)}
              className="vx-press vx-hover-green inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#F7A81B] px-4 text-sm font-bold text-[#3A1410]"
            >
              Choose size
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Quick view (content of the native <dialog>)                         */
/* ------------------------------------------------------------------ */

function QuickViewContent({ product, related, isWishlisted, onToggleWishlist, onAdd, onShare, onClose, onSwitch }) {
  const options = useMemo(() => getSizeOptions(product.sizes), [product.sizes])
  const [reviewState, setReviewState] = useState(() => readProductReviews(product.id))
  const [size, setSize] = useState(null)
  const [needsSize, setNeedsSize] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const reviewCount = reviewState.reviews.length
  const averageRating = reviewCount
    ? reviewState.reviews.reduce((total, review) => total + review.rating, 0) / reviewCount
    : 0

  function handleAdd() {
    if (options.length > 0 && !size) {
      setNeedsSize(true)
      return
    }
    onAdd(product, { size })
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1600)
  }

  function submitReview(event) {
    event.preventDefault()
    if (!reviewRating) {
      setReviewMessage('Choose a star rating before submitting.')
      return
    }

    const review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: reviewName.trim(),
      rating: reviewRating,
      text: reviewText.trim(),
      createdAt: new Date().toISOString(),
    }
    const reviews = [review, ...reviewState.reviews]

    try {
      window.localStorage.setItem(`vastra:reviews:${product.id}`, JSON.stringify(reviews))
      setReviewState({ reviews, error: '' })
      setReviewName('')
      setReviewRating(0)
      setReviewText('')
      setReviewMessage('Thanks for sharing your review.')
    } catch {
      setReviewMessage('Your review could not be saved in this browser. Please try again.')
    }
  }

  return (
    <div className="vx-sheet relative bg-[#FFF6EA] sm:grid sm:grid-cols-2 sm:rounded-[1.75rem]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close quick view"
        className="vx-press absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#3A1410] shadow-sm backdrop-blur"
      >
        <CloseIcon />
      </button>

      <div className="relative aspect-4/5 overflow-hidden bg-white/50 sm:aspect-auto sm:h-[min(70vh,34rem)] sm:min-h-0 sm:rounded-l-[1.75rem]" style={{ background: toneFor(product) }}>
        <img src={product.image} alt={product.imageAlt} className="absolute inset-0 h-full w-full object-contain p-3 sm:p-5" style={{ objectPosition: product.imagePosition }} />
        {product.badge ? (
          <span className="absolute left-4 top-4 max-w-[60%] -rotate-6 truncate rounded-md border-2 border-dashed border-[#3A1410]/70 bg-white/85 px-2.5 py-1 text-xs font-bold text-[#3A1410] backdrop-blur-sm">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col p-6 sm:p-8">
        <p className="truncate pr-12 text-sm text-[#3A1410]/70">
          {product.section}, {product.category}
        </p>
        <h2 id="quick-view-title" className="vx-display mt-2 text-3xl font-extrabold leading-9 text-[#3A1410] wrap-anywhere">
          {product.name}
        </h2>
        <p className="mt-2 text-xl font-bold text-[#B3122A]">{currency.format(product.price)}</p>

        <section className="mt-5 rounded-2xl bg-white/70 p-4" aria-labelledby="quick-view-details-title">
          <h3 id="quick-view-details-title" className="text-sm font-bold">Product details</h3>
          <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            <dt className="text-[#3A1410]/65">Category</dt>
            <dd className="text-right font-medium">{product.category}</dd>
            <dt className="text-[#3A1410]/65">Collection</dt>
            <dd className="text-right font-medium">{product.section}</dd>
            <dt className="text-[#3A1410]/65">Available sizes</dt>
            <dd className="text-right font-medium">{product.sizes}</dd>
            <dt className="text-[#3A1410]/65">Product code</dt>
            <dd className="break-all text-right font-medium">{product.id}</dd>
          </dl>
        </section>

        {options.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#3A1410]">Size</p>
            <div role="radiogroup" aria-label="Size" className="mt-3 flex flex-wrap gap-2">
              {options.map((option) => {
                const selected = size === option
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSize(option)
                      setNeedsSize(false)
                    }}
                    className={`vx-press grid h-12 min-w-12 place-items-center rounded-full border-2 px-4 text-sm font-bold ${
                      selected
                        ? 'border-[#3A1410] bg-[#3A1410] text-[#FFF6EA]'
                        : needsSize
                          ? 'border-[#E2362B] bg-[#FFE1E3] text-[#3A1410]'
                          : 'vx-hover-line border-[#3A1410]/20 bg-white text-[#3A1410]'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
        <p aria-live="polite" className={`mt-3 min-h-5 text-xs ${needsSize ? 'font-semibold text-[#B3122A]' : 'text-[#3A1410]/70'}`}>
          {needsSize ? 'Choose a size to add this to your bag.' : options.length > 0 ? `Available in ${product.sizes}` : product.sizes}
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleAdd}
            data-added={added}
            className="vx-press vx-hover-green inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F7A81B] px-6 text-sm font-bold text-[#3A1410]"
          >
            <SwapLabel active={added} idle={<><BagIcon />Add to bag</>} done={<><CheckIcon />Added to bag</>} />
          </button>
          <button
            type="button"
            onClick={() => onShare(product)}
            className="vx-press vx-hover-line min-h-12 rounded-full border-2 border-[#3A1410]/30 bg-white px-4 text-sm font-bold text-[#3A1410]"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-pressed={isWishlisted}
            aria-label={`${isWishlisted ? 'Remove' : 'Save'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist`}
            className={`vx-press vx-heart grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ${isWishlisted ? 'border-[#3A1410] bg-[#3A1410] text-[#FFB3B9]' : 'vx-hover-line border-[#3A1410]/30 bg-white text-[#3A1410]'}`}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        </div>

        <section className="mt-8 border-t border-[#3A1410]/15 pt-5" aria-labelledby="quick-view-reviews-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 id="quick-view-reviews-title" className="text-lg font-bold">Customer reviews</h3>
              <p className="mt-1 text-sm text-[#3A1410]/70">
                {reviewCount
                  ? `${averageRating.toFixed(1)} out of 5 · ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
                  : 'No reviews yet'}
              </p>
            </div>
            {reviewCount ? (
              <p className="text-lg tracking-wide text-[#B3122A]" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>
                {'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}
              </p>
            ) : null}
          </div>

          {reviewState.error ? <p role="status" className="mt-3 text-sm text-[#B3122A]">{reviewState.error}</p> : null}
          {reviewCount ? (
            <ul className="mt-4 space-y-3">
              {reviewState.reviews.map((review) => (
                <li key={review.id} className="rounded-2xl bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{review.name}</p>
                    <span className="shrink-0 text-sm tracking-wide text-[#B3122A]" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A1410]/80">{review.text}</p>
                  <time className="mt-2 block text-xs text-[#3A1410]/55" dateTime={review.createdAt}>
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(review.createdAt))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#3A1410]/70">Be the first to share what you think about this piece.</p>
          )}

          <form onSubmit={submitReview} className="mt-5 space-y-3 rounded-2xl bg-[#FBE4DB] p-4">
            <h4 className="text-sm font-bold">Write a review</h4>
            <label htmlFor="quick-review-name" className="sr-only">Your name</label>
            <input
              id="quick-review-name"
              required
              maxLength={60}
              value={reviewName}
              onChange={(event) => setReviewName(event.target.value)}
              placeholder="Your name"
              className="min-h-11 w-full rounded-xl border border-[#3A1410]/15 bg-white px-3 text-sm outline-none focus:border-[#3A1410]"
            />
            <fieldset>
              <legend className="text-sm font-medium">Your rating</legend>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    aria-pressed={reviewRating === rating}
                    aria-label={`Rate ${rating} ${rating === 1 ? 'star' : 'stars'}`}
                    onClick={() => setReviewRating(rating)}
                    className={`grid h-10 w-10 place-items-center rounded-lg text-2xl ${rating <= reviewRating ? 'text-[#B3122A]' : 'text-[#3A1410]/30'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="quick-review-text" className="sr-only">Your review</label>
            <textarea
              id="quick-review-text"
              required
              maxLength={1000}
              rows={3}
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Share your thoughts about this product"
              className="w-full resize-y rounded-xl border border-[#3A1410]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#3A1410]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" aria-live="polite" className="text-xs text-[#3A1410]/70">{reviewMessage || 'Reviews are saved on this device.'}</p>
              <button type="submit" className="vx-press vx-hover-green min-h-10 rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA]">
                Submit review
              </button>
            </div>
          </form>
        </section>

        {related.length > 0 ? (
          <div className="mt-8 border-t border-[#3A1410]/15 pt-5">
            <p className="text-sm font-semibold text-[#3A1410]">More like this</p>
            <div className="mt-3 flex gap-3">
              {related.map((item) => (
                <button key={item.id} type="button" onClick={() => onSwitch(item)} aria-label={`View ${item.name}`} className="vx-press w-20 text-left">
                  <span className="block aspect-4/5 overflow-hidden rounded-xl" style={{ background: toneFor(item) }}>
                    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: item.imagePosition }} />
                  </span>
                  <span className="vx-clamp2 mt-1.5 block text-[11px] font-medium leading-4 text-[#3A1410]">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Promises                                                            */
/* ------------------------------------------------------------------ */

const PROMISES = [
  { title: 'Thoughtful materials', body: 'Breathable fabrics chosen for comfort and everyday life.', bg: 'bg-[#7A5BC0] text-white', r: '-2.5deg' },
  { title: 'Easy, safe checkout', body: 'A smooth shopping experience from first click to doorstep.', bg: 'bg-[#E8542B] text-white', r: '2deg' },
  { title: 'Made to be loved', body: 'Versatile pieces you can reach for season after season.', bg: 'bg-[#F26B7A] text-white', r: '-1.5deg' },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Products() {
  const { products, error: catalogError } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { activeGroup, addToGroupCart } = useGroupCart()
  const reduced = useReducedMotion()

  const [activeSection, setActiveSection] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All pieces')
  const [sortBy, setSortBy] = useState('featured')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [wishlist, setWishlist] = useState(readWishlist)
  const [announcement, setAnnouncement] = useState('')
  const [quick, setQuick] = useState(null)
  const [shareProduct, setShareProduct] = useState(null)
  const [quickKey, setQuickKey] = useState(0)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const gridRef = useRef(null)
  const searchRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
    } catch {
      /* storage can be unavailable (private mode); the wishlist still works for this visit */
    }
  }, [wishlist])

  useEffect(() => {
    document.body.classList.toggle('vx-dialog-open', Boolean(quick))
    return () => document.body.classList.remove('vx-dialog-open')
  }, [quick])

  useEffect(() => {
    const productId = new URLSearchParams(location.search).get('product')
    const sharedProduct = products.find((product) => product.id === productId)
    if (sharedProduct) openQuick(sharedProduct)
  }, [location.search, products])

  // "/" jumps to search (keyboard shortcut, deliberately not animated)
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const el = event.target
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Everything except the category, so each chip's count matches what clicking it will show.
  const baseMatches = useMemo(() => {
    const query = search.toLowerCase().trim()
    return products.filter(
      (product) =>
        (activeSection === 'All' || product.section === activeSection) &&
        product.name.toLowerCase().includes(query) &&
        product.price <= maxPrice &&
        (!onlyAvailable || product.sizes) &&
        (!showSaved || wishlist.includes(product.id)),
    )
  }, [activeSection, maxPrice, onlyAvailable, products, search, showSaved, wishlist])

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category,
          category === 'All pieces' ? baseMatches.length : baseMatches.filter((product) => matchesCategory(product, category)).length,
        ]),
      ),
    [baseMatches],
  )

  const visibleProducts = useMemo(() => {
    const filtered = activeCategory === 'All pieces' ? baseMatches : baseMatches.filter((product) => matchesCategory(product, activeCategory))
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return products.indexOf(a) - products.indexOf(b)
    })
  }, [activeCategory, baseMatches, products, sortBy])

  const sidebarFilterCount = (maxPrice < MAX_PRICE ? 1 : 0) + (onlyAvailable ? 1 : 0)

  const activeChips = []
  if (activeSection !== 'All') activeChips.push({ key: 'section', label: activeSection, onRemove: () => setActiveSection('All') })
  if (activeCategory !== 'All pieces') activeChips.push({ key: 'category', label: activeCategory, onRemove: () => setActiveCategory('All pieces') })
  if (search.trim()) activeChips.push({ key: 'search', label: `“${search.trim()}”`, onRemove: () => setSearch('') })
  if (maxPrice < MAX_PRICE) activeChips.push({ key: 'price', label: `Up to ${currency.format(maxPrice)}`, onRemove: () => setMaxPrice(MAX_PRICE) })
  if (onlyAvailable) activeChips.push({ key: 'available', label: 'Available sizes', onRemove: () => setOnlyAvailable(false) })
  if (showSaved) activeChips.push({ key: 'saved', label: 'Saved', onRemove: () => setShowSaved(false) })

  const pricePercent = ((maxPrice - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100
  const resultsLabel = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'piece' : 'pieces'} to explore`

  function handleAddToCart(product, { size = null } = {}) {
    addToCart(size ? { ...product, size } : product)
    const message = `${product.name}${size ? ` in size ${size}` : ''} added to your cart`
    setAnnouncement((previous) => (previous === message ? `${message}.` : message))
  }

  async function handleShareToGroup(product) {
    if (!activeGroup) {
      navigate(`/group-cart?product=${encodeURIComponent(product.id)}`)
      return
    }
    const added = await addToGroupCart(product)
    if (added) {
      const message = `${product.name} added to the group cart`
      setAnnouncement((previous) => (previous === message ? `${message}.` : message))
    }
  }

  function toggleWishlist(productId) {
    setWishlist((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]))
  }

  function clearFilters() {
    setActiveCategory('All pieces')
    setActiveSection('All')
    setSearch('')
    setMaxPrice(MAX_PRICE)
    setOnlyAvailable(false)
    setShowSaved(false)
  }

  function openQuick(product) {
    setQuick(product)
    setQuickKey((key) => key + 1)
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
  }

  function openShare(product) {
    setShareProduct(product)
  }

  function closeQuick() {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.close === 'function') dialog.close()
    else dialog.removeAttribute('open')
  }

  function switchQuick(product) {
    setQuick(product)
    setQuickKey((key) => key + 1)
  }

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  // Clicking a hero slide applies its filter and jumps to the grid
  function pickEdit(action = {}) {
    setActiveSection(action.section || 'All')
    setActiveCategory(action.category || 'All pieces')
    scrollToGrid()
  }

  function pickSection(name) {
    setActiveSection((current) => (current === name ? 'All' : name))
  }

  const related = quick ? products.filter((product) => product.id !== quick.id && product.section === quick.section).slice(0, 3) : []
  const [mainTile, wideTile, dressTile, topTile] = HERO_TILES

  return (
    <div className="vx-root pb-10">
      <style>{styles}</style>

      <h1 className="sr-only">Vastra products</h1>
      {catalogError ? <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Some managed products may be unavailable: {catalogError}</p> : null}

      {/* Section pills */}
      <nav aria-label="Shop by section" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SECTIONS.map((section) => {
          const active = activeSection === section.name
          const total = products.filter((product) => product.section === section.name).length
          return (
            <button
              key={section.name}
              type="button"
              aria-pressed={active}
              onClick={() => pickSection(section.name)}
              className={`vx-pill vx-display flex min-h-16 items-center justify-center gap-3 rounded-full border-2 border-[#3A1410] px-5 text-xl font-extrabold sm:text-2xl ${active ? 'bg-[#3A1410] text-[#FFF6EA] shadow-[0_6px_0_0_rgba(58,20,16,0.18)]' : 'text-[#3A1410]'}`}
              style={active ? undefined : { backgroundColor: section.tone }}
            >
              {section.name}
              <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${active ? 'bg-[#F7A81B] text-[#3A1410]' : 'bg-[#3A1410] text-[#FFF6EA]'}`}>{total}</span>
            </button>
          )
        })}
      </nav>

      {/* Hero: four sliding photo tiles */}
      <section aria-label="Featured edits" className="mt-5 grid gap-4 lg:h-[36rem] lg:grid-cols-12 lg:grid-rows-2">
        <Slider tile={mainTile} reduced={reduced} onPick={pickEdit} className="h-[26rem] sm:h-[30rem] lg:col-span-6 lg:row-span-2 lg:h-auto" />
        <Slider tile={wideTile} reduced={reduced} onPick={pickEdit} className="h-60 lg:col-span-6 lg:h-auto" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6 lg:min-h-0">
          <Slider tile={dressTile} reduced={reduced} onPick={pickEdit} className="h-60 lg:h-full" />
          <Slider tile={topTile} reduced={reduced} onPick={pickEdit} className="h-60 lg:h-full" />
        </div>
      </section>

      {/* Product grid */}
      <section ref={gridRef} className="mt-16 scroll-mt-24" aria-labelledby="all-products-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Heading
              bold={activeSection === 'All' ? 'Everything' : activeSection}
              light={activeSection === 'All' ? 'we make' : 'collection'}
              className="text-4xl sm:text-6xl"
            />
            <span id="all-products-title" className="sr-only">
              {activeSection === 'All' ? 'All pieces' : `${activeSection} collection`}
            </span>
            <p className="mt-3 text-sm text-[#3A1410]/70" aria-live="polite">
              {resultsLabel}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label className="flex min-h-11 items-center gap-3 rounded-full border-2 border-[#3A1410]/15 bg-white px-4 text-sm text-[#3A1410]/70 focus-within:border-[#3A1410]">
              <SearchIcon />
              <span className="sr-only">Search products</span>
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pieces"
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-[#3A1410] outline-none placeholder:text-[#3A1410]/45 sm:w-40 sm:flex-none [&::-webkit-search-cancel-button]:hidden"
              />
              {search ? (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="vx-press -mr-2 grid h-8 w-8 place-items-center rounded-full text-[#3A1410]/70">
                  <CloseIcon small />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-[#3A1410]/20 px-1.5 py-0.5 text-[11px] font-semibold text-[#3A1410]/50 lg:inline" aria-hidden="true">
                  /
                </kbd>
              )}
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-full border-2 border-[#3A1410]/15 bg-white px-4 text-sm font-medium text-[#3A1410]">
              <span className="text-[#3A1410]/70">Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="bg-transparent font-semibold outline-none">
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
              aria-controls="product-filters"
              className="vx-press vx-hover-line inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-[#3A1410]/20 bg-white px-5 text-sm font-bold text-[#3A1410]"
            >
              <SlidersIcon />
              Filters
              {sidebarFilterCount > 0 ? <span className="rounded-full bg-[#E2362B] px-2 py-0.5 text-[11px] font-bold text-white">{sidebarFilterCount}</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setShowSaved((current) => !current)}
              aria-pressed={showSaved}
              className={`vx-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 text-sm font-bold ${
                showSaved ? 'border-[#3A1410] bg-[#3A1410] text-[#FFF6EA]' : 'vx-hover-line border-[#3A1410]/20 bg-white text-[#3A1410]'
              }`}
            >
              <span className={showSaved ? 'text-[#FFB3B9]' : ''}>
                <HeartIcon filled={showSaved} />
              </span>
              Saved
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${showSaved ? 'bg-white/20 text-white' : 'bg-[#FBE4DB] text-[#3A1410]'}`}>{wishlist.length}</span>
            </button>
          </div>
        </div>

        {/* Filter panel */}
        <div id="product-filters" className="vx-fold" data-open={showFilters}>
          <div>
            <div className="mt-5 grid gap-6 rounded-3xl bg-[#FBE4DB] p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:p-6">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="price-range" className="text-sm font-bold text-[#3A1410]">
                    Price
                  </label>
                  <span className="text-xs text-[#3A1410]/70">Up to {currency.format(maxPrice)}</span>
                </div>
                <input
                  id="price-range"
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step="100"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="vx-range mt-3"
                  style={{ '--pct': `${pricePercent}%` }}
                />
                <div className="mt-1 flex justify-between text-xs text-[#3A1410]/60">
                  <span>{currency.format(MIN_PRICE)}</span>
                  <span>{currency.format(MAX_PRICE)}</span>
                </div>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-[#3A1410]">
                <input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} className="h-5 w-5 accent-[#3A1410]" />
                Show available sizes
              </label>
              <button type="button" onClick={clearFilters} className="vx-hover-underline min-h-11 text-sm font-bold text-[#B3122A]">
                Clear all
              </button>
            </div>
          </div>
        </div>

        {/* Type chips */}
        <div className="vx-noscroll -mx-1 mt-6 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {categories.map((category) => {
            const active = activeCategory === category
            const count = categoryCounts[category]
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={active}
                className={`vx-press inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border-2 px-5 text-sm font-bold ${
                  active ? 'border-[#3A1410] bg-[#3A1410] text-[#FFF6EA]' : 'vx-hover-line border-[#3A1410]/20 bg-white text-[#3A1410]'
                } ${count === 0 && !active ? 'opacity-60' : ''}`}
              >
                {category}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-[#FBE4DB] text-[#3A1410]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {activeChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove filter: ${chip.label}`}
                className="vx-press vx-hover-line inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border-2 border-[#3A1410]/25 bg-white py-1.5 pl-3.5 pr-2.5 text-xs font-bold text-[#3A1410]"
              >
                <span className="max-w-48 truncate">{chip.label}</span>
                <CloseIcon small />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="vx-hover-underline px-2 text-xs font-bold text-[#B3122A] underline-offset-2">
              Clear all
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                  onShare={openShare}
                  onOpen={openQuick}
                />
              ))}
            </div>
          ) : (
            <div className="vx-enter rounded-[2rem] border-2 border-dashed border-[#3A1410]/25 px-6 py-20 text-center">
              <h3 className="vx-display text-2xl font-extrabold text-[#3A1410]">{showSaved && wishlist.length === 0 ? 'Nothing saved yet' : 'No pieces found'}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-[#3A1410]/70">
                {showSaved && wishlist.length === 0 ? 'Tap the heart on any piece to keep it here.' : 'Try another search or clear your filters.'}
              </p>
              <button type="button" onClick={clearFilters} className="vx-press vx-hover-green mt-6 min-h-11 rounded-full bg-[#3A1410] px-6 text-sm font-bold text-[#FFF6EA]">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Promises */}
      <section className="mt-20" aria-label="Vastra promises">
        <ul className="grid gap-5 md:grid-cols-3">
          {PROMISES.map((item, i) => (
            <li key={item.title} className={`vx-tilt rounded-[1.75rem] p-7 ${item.bg} ${i === 1 ? 'md:mt-6' : ''}`} style={{ '--r': item.r }}>
              <h3 className="vx-display text-2xl font-bold leading-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 opacity-95">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Newsletter */}
      <section className="mt-16 rounded-[2.5rem] bg-[#F7A81B] p-8 text-center sm:p-12">
        <Heading bold="New drops," light="thoughtful edits" className="text-3xl sm:text-5xl" />
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#3A1410]">Get first access to new collections and stories from Vastra.</p>
        {subscribed ? (
          <p role="status" className="vx-enter mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full bg-[#FFF6EA] px-5 py-3 text-sm font-bold text-[#065f46]">
            <CheckIcon />
            You’re on the list. Watch your inbox.
          </p>
        ) : (
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              setSubscribed(true)
            }}
          >
            <label className="sr-only" htmlFor="products-email">
              Email address
            </label>
            <input
              id="products-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="send"
              placeholder="Your email address"
              className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-transparent bg-[#FFF6EA] px-5 py-3 text-sm text-[#3A1410] outline-none placeholder:text-[#3A1410]/50 focus:border-[#3A1410]"
            />
            <button type="submit" className="vx-press vx-hover-green min-h-12 rounded-full bg-[#3A1410] px-7 text-sm font-bold text-[#FFF6EA]">
              Subscribe
            </button>
          </form>
        )}
      </section>

      {/* Quick view */}
      <dialog
        ref={dialogRef}
        className="vx-dialog"
        aria-labelledby="quick-view-title"
        onClose={() => setQuick(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeQuick()
        }}
      >
        {quick ? (
          <QuickViewContent
            key={`${quick.id}-${quickKey}`}
            product={quick}
            related={related}
            isWishlisted={wishlist.includes(quick.id)}
            onToggleWishlist={toggleWishlist}
            onAdd={handleAddToCart}
            onShare={openShare}
            onClose={closeQuick}
            onSwitch={switchQuick}
          />
        ) : null}
      </dialog>
      {shareProduct ? (
        <ProductShareSheet
          product={shareProduct}
          onClose={() => setShareProduct(null)}
          onShareToGroup={handleShareToGroup}
        />
      ) : null}
    </div>
  )
}