import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useCatalog } from '../context/useCatalog'
import pro3 from '../assets/products/pro3.jpg'
import pos2 from '../assets/posters/pos2.jpg'
import springCampaign from '../assets/posters/Blooming into spring, one cute outfit at a time___[Khaadi, Wear Yourself, Ready To Wear].jpg'
import hoodieCampaign from '../assets/posters/Creative Hoodie Ad Manipulation _ Social Media Design Idea.jpg'
import feltLandscape from '../assets/banners/Whimsical Felt-Craft Fashion Landscape.png'
import welcomeBanner from '../assets/banners/Gemini_Generated_Image_wzf55awzf55awzf5.png'
import floralShirtCampaign from '../assets/banners/Gemini_Generated_Image_v9jg9hv9jg9hv9jg.png'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const PILLS = [
  { t: 'Organic cotton', c: 'bg-[#E2362B] text-white' },
  { t: 'Handloom weaves', c: 'bg-[#6B2E22] text-white' },
  { t: 'Natural dyes', c: 'bg-[#FFE1E3] text-[#3A1410]' },
  { t: 'Slow fashion', c: 'bg-[#F7A81B] text-[#3A1410]' },
  { t: 'Made in India', c: 'bg-[#7A5BC0] text-white' },
  { t: 'Plastic-free packing', c: 'bg-[#F26B7A] text-white' },
  { t: 'Easy returns', c: 'bg-[#C9783F] text-white' },
  { t: 'Festive ready', c: 'bg-[#FBE4D2] text-[#3A1410]' },
]

const WISHLIST_KEY = 'vastra:wishlist'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function readWishlist() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/*                                                                     */
/* Look: warm cream paper, soft gulabi hero, colour-block cards, tilted */
/* sticker cards and one curved ribbon. Tailwind v4 (individual        */
/* `rotate` property is used for tilts so hover can straighten them).  */
/* ------------------------------------------------------------------ */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,800&display=swap');
body{overflow-x:clip}
.vh-root{--ink:#3A1410;--cream:#FFF6EA;--ease:cubic-bezier(0.23,1,0.32,1);position:relative;isolation:isolate;font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);-webkit-tap-highlight-color:transparent}
.vh-root::before{content:'';position:absolute;z-index:-1;top:-2.5rem;bottom:-2.5rem;left:calc(50% - 50vw);right:calc(50% - 50vw);background:var(--cream)}
.vh-display{font-family:'Fraunces',Georgia,serif;font-optical-sizing:auto}
.vh-root :focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.vh-dark :focus-visible{outline-color:var(--cream)}
.vh-root button,.vh-root a{touch-action:manipulation}
.vh-root button{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.vh-noscroll{scrollbar-width:none}
.vh-noscroll::-webkit-scrollbar{display:none}
.vh-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}

.vh-press{transition:transform 160ms var(--ease),background-color 160ms ease,color 160ms ease}
.vh-press:active{transform:scale(0.97)}
.vh-press[data-added="true"]{background-color:#065f46;color:#fff}

.vh-banner-image{transition:opacity 700ms ease}

/* Scrolling pills */
.vh-marquee{overflow:hidden;-webkit-mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent)}
.vh-track{display:flex;width:max-content;animation:vh-slide 40s linear infinite}
.vh-track[data-rev="true"]{animation-direction:reverse}
@keyframes vh-slide{to{transform:translateX(-50%)}}

/* Tilted cards (tablet and up) */
@media (min-width:768px){
  .vh-tilt{rotate:var(--r,0deg);transition:rotate 300ms var(--ease),translate 300ms var(--ease)}
}

.vh-card{transition:transform 240ms var(--ease),box-shadow 240ms var(--ease)}
.vh-heart[aria-pressed="true"] svg{animation:vh-pop 260ms var(--ease)}
@keyframes vh-pop{0%{transform:scale(0.8)}60%{transform:scale(1.18)}100%{transform:scale(1)}}

.vh-swap{display:grid;place-items:center}
.vh-swap-item{grid-area:1/1;display:inline-flex;align-items:center;gap:0.5rem;transition:opacity 200ms ease,filter 200ms ease,transform 200ms var(--ease)}
.vh-swap-item[data-on="false"]{opacity:0;filter:blur(3px);transform:translateY(6px) scale(0.92)}

.vh-arch-img{transition:filter 400ms ease,transform 500ms var(--ease)}

@media (hover:hover) and (pointer:fine){
  .vh-hover-green:hover{background-color:#065f46;color:#fff}
  .vh-hover-ink:hover{background-color:var(--ink);color:var(--cream)}
  .vh-hover-soft:hover{background-color:#fff}
  .vh-link:hover{color:#E2362B}
  .vh-marquee:hover .vh-track{animation-play-state:paused}
  .vh-arch-img{filter:sepia(0.45) saturate(0.8) contrast(0.96)}
  .vh-card:hover .vh-arch-img,.vh-card:focus-within .vh-arch-img{filter:none}
}
@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){
  .vh-card:hover{transform:translateY(-4px);box-shadow:0 22px 40px -22px rgb(58 20 16 / 0.45)}
  .vh-card:hover .vh-arch-img{transform:scale(1.04)}
  .vh-tilt:hover{rotate:0deg;translate:0 -6px}
}
@media (prefers-reduced-motion:reduce){
  .vh-track,.vh-banner-image{animation:none;transition-duration:1ms}
  .vh-heart[aria-pressed="true"] svg{animation:none}
  .vh-swap-item[data-on="false"]{transform:none}
}
`

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

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

function HeartIcon({ filled }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.7Z" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Label({ children, dark = false }) {
  return (
    <span className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-medium ${dark ? 'border-[#FFF6EA]/50 text-[#FFF6EA]' : 'border-[#3A1410]/60 text-[#3A1410]'}`}>
      {children}
    </span>
  )
}

function Heading({ bold, light, dark = false, className = '' }) {
  return (
    <h2 className={`vh-display text-4xl leading-[1.02] sm:text-6xl ${dark ? 'text-[#FFF6EA]' : 'text-[#3A1410]'} ${className}`}>
      <span className="block font-extrabold">{bold}</span>
      <span className="block font-normal">{light}</span>
    </h2>
  )
}

function SwapLabel({ active, idle, done }) {
  return (
    <span className="vh-swap">
      <span className="vh-swap-item" data-on={!active} aria-hidden={active}>
        {idle}
      </span>
      <span className="vh-swap-item" data-on={active} aria-hidden={!active}>
        {done}
      </span>
    </span>
  )
}

function PillRow({ reverse = false }) {
  return (
    <div className="vh-marquee" aria-hidden="true">
      <div className="vh-track" data-rev={reverse}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 gap-3 pr-3">
            {PILLS.map((pill) => (
              <li key={pill.t} className={`vh-display whitespace-nowrap rounded-full px-6 py-3 text-base font-bold ${pill.c}`}>
                {pill.t}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero banner                                                         */
/* ------------------------------------------------------------------ */

const HOME_BANNER_SLIDES = [
  {
    image: feltLandscape,
    imageAlt: 'Whimsical felt-craft fashion landscape',
  },
  {
    image: welcomeBanner,
    imageAlt: 'Models in a collection of contemporary everyday outfits',
  },
  {
    image: floralShirtCampaign,
    imageAlt: 'Dark floral printed shirt styled for a fashion campaign',
  },
]

function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HOME_BANNER_SLIDES.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isPaused])

  return (
    <section
      className="relative isolate h-116 overflow-hidden rounded-4xl bg-[#3A1410] text-[#FFF6EA] sm:h-128 sm:rounded-[2.5rem]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
      }}
    >
      {HOME_BANNER_SLIDES.map((slide, index) => (
        <div
          key={slide.image}
          className={`vh-banner-image absolute inset-0 ${index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${HOME_BANNER_SLIDES.length}`}
          aria-hidden={index !== activeIndex}
        >
          <img
            src={slide.image}
            alt={slide.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <Link
            to="/products"
            tabIndex={index === activeIndex ? undefined : -1}
            className="absolute inset-0"
            aria-label={`Shop collection slide ${index + 1}`}
          />
        </div>
      ))}

      <div className="absolute bottom-5 left-7 z-10 flex items-center gap-2.5 sm:bottom-7 sm:left-14">
        {HOME_BANNER_SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/85'
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex gap-2 sm:bottom-6 sm:right-6">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setActiveIndex((current) => (current - 1 + HOME_BANNER_SLIDES.length) % HOME_BANNER_SLIDES.length)}
          className="vh-press grid h-11 w-11 rotate-180 place-items-center rounded-full border border-white/60 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#3A1410]"
        >
          <ArrowIcon />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setActiveIndex((current) => (current + 1) % HOME_BANNER_SLIDES.length)}
          className="vh-press grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#3A1410]"
        >
          <ArrowIcon />
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Bento                                                               */
/* ------------------------------------------------------------------ */

function ImageBlock({ src, alt, position, className = '' }) {
  return (
    <div className={`relative min-h-72 overflow-hidden rounded-4xl bg-[#FBE4D2] ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
    </div>
  )
}

function TextBlock({ title, body, className }) {
  return (
    <div className={`flex min-h-52 flex-col items-center justify-center rounded-4xl p-8 text-center ${className}`}>
      <h3 className="vh-display text-2xl font-bold leading-tight sm:text-[1.7rem]">{title}</h3>
      <p className="mt-3 max-w-[16rem] text-sm leading-6 opacity-90">{body}</p>
    </div>
  )
}

function Benefits() {
  return (
    <section className="mt-20 sm:mt-24" aria-labelledby="benefits-title">
      <div className="text-center">
        <Label>Why Vastra</Label>
        <Heading bold="Made for puja," light="built for every day" className="mt-5" />
        <span id="benefits-title" className="sr-only">Why Vastra</span>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:auto-rows-56 lg:grid-cols-3">
        <TextBlock className="bg-[#6B2E22] text-[#FFF6EA]" title="Fabric that breathes" body="Light cotton and handloom weaves that stay cool through pandal evenings." />
        <TextBlock className="bg-[#F7A81B] text-[#3A1410]" title="Colour with a story" body="Prints drawn from rangoli, mitti and the first monsoon sky." />
        <ImageBlock src={springCampaign} alt="Spring fashion campaign with a floral outfit" position="center 35%" className="lg:row-span-2" />
        <ImageBlock src={welcomeBanner} alt="Models in a collection of contemporary outfits" position="center 42%" className="lg:row-span-2" />
        <ImageBlock src={pos2} alt="Styled clothing and accessories" position="center 48%" />
        <TextBlock className="bg-[#F26B7A] text-white" title="Made to be kept" body="Stitched for a hundred washes and every season after." />
        <ImageBlock src={hoodieCampaign} alt="Blue hoodie in a fashion campaign" position="center 48%" />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Ribbon + reasons                                                    */
/* ------------------------------------------------------------------ */

function Ribbon() {
  const line = 'colour for every day • made by hand • worn on repeat • '
  return (
    <svg viewBox="0 0 1200 220" className="my-8 block w-full overflow-visible sm:my-12" aria-hidden="true" focusable="false">
      <path id="vh-ribbon" d="M-40 120 C 180 -20, 330 250, 600 120 S 1020 -10, 1240 110" fill="none" stroke="#F7A81B" strokeWidth="62" strokeLinecap="round" />
      <text className="vh-display" fontSize="24" fontWeight="800" fill="#3A1410" letterSpacing="1.5" dominantBaseline="central">
        <textPath href="#vh-ribbon">{line.repeat(3)}</textPath>
      </text>
    </svg>
  )
}

const REASONS = [
  { title: 'Gentle on skin', body: 'Breathable cotton and handloom weaves with no harsh finishes, soft from the first wear.', bg: 'bg-[#7A5BC0] text-white', r: '-3deg', offset: 'md:mt-6' },
  { title: 'Colour from India', body: 'Prints drawn from rangoli, mitti and monsoon skies, made with artisan partners.', bg: 'bg-[#E8542B] text-white', r: '2deg', offset: '', image: true },
  { title: 'Ready for any occasion', body: 'Puja evenings, weddings, Sunday markets: pieces that move between them.', bg: 'bg-[#F26B7A] text-white', r: '-2deg', offset: 'md:mt-8' },
  { title: 'Packed without plastic', body: 'Orders arrive in recycled, plastic-free packaging, right on time.', bg: 'bg-[#F7C93B] text-[#3A1410]', r: '3deg', offset: 'md:mt-2' },
]

function Reasons() {
  return (
    <section className="mt-6" aria-labelledby="reasons-title">
      <Ribbon />
      <div className="text-center">
        <Label>How we make it</Label>
        <Heading bold="Thought through," light="down to the thread" className="mt-5" />
        <span id="reasons-title" className="sr-only">How we make it</span>
      </div>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((item) => (
          <li key={item.title} className={`vh-tilt relative flex min-h-80 flex-col rounded-[1.75rem] p-6 ${item.bg} ${item.offset}`} style={{ '--r': item.r }}>
            <h3 className="vh-display text-2xl font-bold leading-tight">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 opacity-95">{item.body}</p>
            {item.image ? (
              <img
                src={pro3}
                alt=""
                loading="lazy"
                className="mt-auto -rotate-3 self-center rounded-2xl border-4 border-white object-cover shadow-lg"
                style={{ width: '70%', aspectRatio: '5 / 4', objectPosition: 'center 40%' }}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Product tiles                                                       */
/* ------------------------------------------------------------------ */

function FeaturedCard({ product, index, isSaved, isAdded, onSave, onAdd }) {
  const tilt = ['-1.5deg', '1deg', '-1deg', '1.5deg'][index % 4]
  return (
    <div className="w-[80%] shrink-0 snap-start sm:w-auto">
      <article className="vh-card vh-tilt h-full rounded-4xl p-3 pb-5" style={{ background: product.tone, '--r': tilt }}>
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-white/60">
          <img src={product.image} alt={product.imageAlt} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: product.imagePosition }} />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {product.badge ? (
              <span className="-rotate-6 rounded-md border-2 border-dashed border-[#3A1410]/70 bg-white/85 px-2.5 py-1 text-xs font-bold text-[#3A1410] backdrop-blur-sm">{product.badge}</span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onSave(product.id)}
              aria-pressed={isSaved}
              aria-label={`${isSaved ? 'Remove' : 'Save'} ${product.name} ${isSaved ? 'from' : 'to'} wishlist`}
              className={`vh-press vh-heart pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full ${isSaved ? 'bg-[#3A1410] text-[#FFB3B9]' : 'vh-hover-soft bg-white/90 text-[#3A1410]'}`}
            >
              <HeartIcon filled={isSaved} />
            </button>
          </div>
        </div>
        <div className="px-2 pt-4">
          <p className="truncate text-sm text-[#3A1410]/70">{product.category}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h3 className="vh-display vh-clamp2 text-xl font-bold leading-6 text-[#3A1410]">{product.name}</h3>
            <p className="shrink-0 rounded-full bg-[#3A1410] px-3 py-1 text-sm font-bold text-[#FFF6EA]">{currency.format(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            data-added={isAdded}
            className="vh-press vh-hover-green mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#F7A81B] px-5 text-sm font-bold text-[#3A1410]"
          >
            {product.sizes ? 'Choose size' : <SwapLabel active={isAdded} idle={<><BagIcon />Add to cart</>} done={<><CheckIcon />Added</>} />}
          </button>
        </div>
      </article>
    </div>
  )
}

function ArchiveCard({ product, isAdded, onAdd }) {
  return (
    <div className="w-[80%] shrink-0 snap-start sm:w-auto">
      <article className="vh-card relative h-full rounded-2xl bg-[#FFF6EA] p-3 pb-5">
        <span aria-hidden="true" className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-xs bg-[#F7C93B]/90" />
        <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-[#FBE4D2]">
          <img src={product.image} alt={product.imageAlt} loading="lazy" className="vh-arch-img h-full w-full object-cover" style={{ objectPosition: product.imagePosition }} />
          <span className="absolute left-3 top-3 -rotate-6 rounded-md border-2 border-dashed border-[#3A1410]/70 bg-white/85 px-2.5 py-1 text-xs font-bold text-[#3A1410] backdrop-blur-sm">
            From the archive
          </span>
        </div>
        <div className="px-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="vh-display vh-clamp2 text-lg font-bold leading-6 text-[#3A1410]">{product.name}</h3>
            <p className="shrink-0 text-base font-bold text-[#B3122A]">{currency.format(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            data-added={isAdded}
            className="vh-press vh-hover-green mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA]"
          >
            <SwapLabel active={isAdded} idle={<><BagIcon />Add to cart</>} done={<><CheckIcon />Added</>} />
          </button>
        </div>
      </article>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const { products: catalogProducts } = useCatalog()
  const featuredProducts = catalogProducts.slice(0, 4).map((product, index) => ({
    ...product,
    tone: ['#FFD6D9', '#FFE7A3', '#E5DAF8', '#FBE1D6'][index % 4],
  }))
  const pastProducts = catalogProducts.slice(4, 8)
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [wishlist, setWishlist] = useState(readWishlist)
  const [addedId, setAddedId] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const addedTimer = useRef(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
    } catch {
      /* storage can be unavailable; hearts still work for this visit */
    }
  }, [wishlist])

  useEffect(() => () => clearTimeout(addedTimer.current), [])

  function handleAdd(product) {
    if (product.sizes) {
      navigate(`/products?product=${encodeURIComponent(product.id)}`)
      return
    }

    addToCart(product)
    const message = `${product.name} added to your cart`
    setAnnouncement((previous) => (previous === message ? `${message}.` : message))
    setAddedId(product.id)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAddedId(null), 1400)
  }

  function toggleWishlist(id) {
    setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div className="vh-root pb-6">
      <style>{styles}</style>

      <Hero />

      <div className="mt-8 flex flex-col gap-3">
        <PillRow />
        <PillRow reverse />
      </div>

      <Benefits />
      <Reasons />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* Featured */}
      <section className="mt-20 sm:mt-24" aria-labelledby="featured-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label>Curated for you</Label>
            <Heading bold="Meet your" light="new favourites" className="mt-5" />
            <span id="featured-title" className="sr-only">Meet your new favourites</span>
          </div>
          <Link to="/products" className="vh-link inline-flex min-h-11 w-fit items-center gap-2 text-base font-semibold underline decoration-[#E2362B] decoration-2 underline-offset-4 transition-colors">
            See all products <ArrowIcon />
          </Link>
        </div>
        <div className="vh-noscroll -mx-1 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <FeaturedCard
              key={product.id}
              product={product}
              index={index}
              isSaved={wishlist.includes(product.id)}
              isAdded={addedId === product.id}
              onSave={toggleWishlist}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </section>

      {/* Archive */}
      <section className="vh-dark mt-20 rounded-[2.5rem] bg-[#3A1410] px-5 py-12 sm:mt-24 sm:px-10 sm:py-16" aria-labelledby="archive-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label dark>Back by request</Label>
            <Heading dark bold="Past" light="favourites" className="mt-5" />
            <span id="archive-title" className="sr-only">Past favourites</span>
          </div>
          <Link to="/products" className="inline-flex min-h-11 w-fit items-center gap-2 text-base font-semibold text-[#FFF6EA] underline decoration-[#F7A81B] decoration-2 underline-offset-4 transition-colors hover:text-[#F7A81B]">
            Browse the collection <ArrowIcon />
          </Link>
        </div>
        <div className="vh-noscroll -mx-1 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 pt-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {pastProducts.map((product) => (
            <ArchiveCard key={product.id} product={product} isAdded={addedId === product.id} onAdd={handleAdd} />
          ))}
        </div>
      </section>

      {/* Closing band */}
      <section className="mt-16 overflow-hidden rounded-[2.5rem] bg-[#F7A81B] px-6 py-14 text-center sm:mt-20 sm:py-20" aria-label="Start shopping">
        <h2 className="vh-display mx-auto max-w-2xl text-4xl leading-[1.02] text-[#3A1410] sm:text-6xl">
          <span className="block font-extrabold">Your puja wardrobe</span>
          <span className="block font-normal">is waiting</span>
        </h2>
        <Link to="/products" className="vh-press vh-hover-green mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#3A1410] px-8 text-base font-semibold text-[#FFF6EA]">
          Shop the collection <ArrowIcon />
        </Link>
      </section>
    </div>
  )
}