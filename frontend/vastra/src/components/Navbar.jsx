import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useAuth } from '../context/useAuth'
import AccountAvatar from './AccountAvatar'

const links = [
  { label: 'Products', to: '/products' },
  { label: 'Group Cart', to: '/group-cart' },
  { label: 'Orders', to: '/orders' },
  { label: 'Admin', to: '/admin' },
]

/* Same look as Home and Products: cream paper, maroon ink, gulabi pink, marigold.
   Motion is limited to transform and opacity, hover is gated to real pointers,
   and reduced motion drops the movement. */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,800&display=swap');
.vn-root{--ink:#3A1410;--cream:#FFF6EA;--ease:cubic-bezier(0.23,1,0.32,1);font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);-webkit-tap-highlight-color:transparent}
.vn-display{font-family:'Fraunces',Georgia,serif;font-optical-sizing:auto}
.vn-root :focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.vn-root a,.vn-root button{touch-action:manipulation}
.vn-root button{-webkit-user-select:none;user-select:none}

.vn-press{transition:transform 160ms var(--ease),background-color 160ms ease,color 160ms ease}
.vn-press:active{transform:scale(0.97)}

/* Rolling link text */
.vn-roll{position:relative;display:block;overflow:hidden;height:1.5rem;line-height:1.5rem}
.vn-roll>span{display:block;transition:transform 300ms var(--ease)}
.vn-roll>span+span{position:absolute;left:0;top:100%}

/* Active page marker */
.vn-link{position:relative;padding:0.25rem 0.1rem}
.vn-link::after{content:'';position:absolute;left:0;right:0;bottom:-0.2rem;height:3px;border-radius:9999px;background:#F7A81B;transform:scaleX(0);transform-origin:left;transition:transform 260ms var(--ease)}
.vn-link[data-active="true"]::after{transform:scaleX(1)}

/* Cart count pops when it changes */
.vn-count{animation:vn-pop 300ms var(--ease)}
@keyframes vn-pop{0%{transform:scale(0.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}

/* Mobile menu: slides down, stays in the DOM so the close can animate too */
.vn-menu{opacity:0;transform:translateY(-10px) scale(0.98);visibility:hidden;transform-origin:top center;transition:opacity 200ms var(--ease),transform 240ms var(--ease),visibility 0s linear 240ms}
.vn-menu[data-open="true"]{opacity:1;transform:none;visibility:visible;transition-delay:0s}
.vn-menu-item{opacity:0;transform:translateY(8px);transition:opacity 240ms var(--ease),transform 240ms var(--ease);transition-delay:0ms}
.vn-menu[data-open="true"] .vn-menu-item{opacity:1;transform:none;transition-delay:calc(var(--i,0) * 50ms + 60ms)}

.vn-logo-mark{transition:rotate 300ms var(--ease)}

@media (hover:hover) and (pointer:fine){
  .vn-hover-ink:hover{background-color:var(--ink);color:var(--cream)}
  .vn-hover-green:hover{background-color:#065f46;color:#fff}
  .vn-hover-soft:hover{background-color:#fff}
  .vn-link:hover::after{transform:scaleX(1)}
}
@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){
  .vn-link:hover .vn-roll>span{transform:translateY(-100%)}
  .vn-logo:hover .vn-logo-mark{rotate:20deg}
}
@media (prefers-reduced-motion:reduce){
  .vn-count{animation:none}
  .vn-menu,.vn-menu-item{transform:none}
}
`

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function Sparkle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 2c.8 5.2 3.4 8.2 10 10-6.6 1.8-9.2 4.8-10 10-.8-5.2-3.4-8.2-10-10 6.6-1.8 9.2-4.8 10-10Z" />
    </svg>
  )
}

// Link label that "rolls" up on hover (real pointers only)
function RollLabel({ children }) {
  return (
    <span className="vn-roll" aria-hidden="false">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { itemCount: cartCount } = useCart()
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    const result = await signOut()
    if (result.ok) navigate('/')
    else navigate('/login', { state: { authError: result.error } })
    setOpen(false)
  }

  // Close the menu after navigating
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setOpen(false)
  }

  // Escape closes the menu
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="vn-root sticky top-4 z-50 flex justify-center px-4">
      <style>{styles}</style>

      <nav
        aria-label="Main"
        className="relative flex w-full max-w-5xl items-center justify-between rounded-full border-2 border-[#3A1410] bg-[#FFF6EA] py-2.5 pl-3 pr-3 shadow-[0_6px_0_0_rgba(58,20,16,0.12)] md:pl-4 md:pr-3"
      >
        {/* Logo */}
        <Link to="/" className="vn-logo flex min-h-11 items-center gap-2.5 rounded-full pr-2" aria-label="Vastra home">
          <span className="vn-logo-mark grid h-9 w-9 -rotate-6 place-items-center rounded-full bg-[#F7A81B] text-[#3A1410]">
            <Sparkle />
          </span>
          <span className="vn-display text-2xl font-extrabold leading-none tracking-tight">Vastra</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 text-[15px] font-semibold md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="vn-link" data-active={location.pathname === l.to}>
              <RollLabel>{l.label}</RollLabel>
            </NavLink>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
            className="vn-press vn-hover-green flex min-h-11 items-center gap-2 rounded-full bg-[#F7A81B] px-5 text-sm font-bold text-[#3A1410]"
          >
            <CartIcon />
            Cart
            {cartCount > 0 && (
              <span key={cartCount} className="vn-count grid h-5 min-w-5 place-items-center rounded-full bg-[#3A1410] px-1.5 text-[11px] font-bold text-[#FFF6EA]">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                aria-label="Your profile"
                title="Your profile"
                className="vn-press flex min-h-11 items-center gap-2 rounded-full border border-[#3A1410]/15 bg-white/70 py-1 pl-1 pr-3 text-sm font-bold"
              >
                <AccountAvatar
                  src={profile?.avatar_url}
                  firstName={profile?.first_name || user.user_metadata?.first_name}
                  lastName={profile?.last_name || user.user_metadata?.last_name}
                  email={user.email}
                />
                <span className="max-w-32 truncate">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Profile'}</span>
              </Link>
              <button type="button" onClick={handleSignOut} className="vn-press vn-hover-ink flex min-h-11 items-center rounded-full border-2 border-[#3A1410] px-5 text-sm font-bold text-[#3A1410]">
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="vn-press vn-hover-ink flex min-h-11 items-center rounded-full border-2 border-[#3A1410] px-5 text-sm font-bold text-[#3A1410]"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile: cart shortcut + menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
            className="vn-press relative grid h-11 w-11 place-items-center rounded-full bg-[#F7A81B] text-[#3A1410]"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span key={cartCount} className="vn-count absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#E2362B] px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="vn-press grid h-11 w-11 place-items-center rounded-full bg-[#3A1410] text-[#FFF6EA]"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          data-open={open}
          className="vn-menu absolute left-0 top-full mt-3 w-full rounded-4xl border-2 border-[#3A1410] bg-[#F58A8F] p-3 md:hidden"
        >
          <ul className="flex flex-col gap-2">
            {links.map((l, i) => (
              <li key={l.to} className="vn-menu-item" style={{ '--i': i }}>
                <NavLink
                  to={l.to}
                  tabIndex={open ? 0 : -1}
                  className={({ isActive }) =>
                    `vn-press vn-display flex min-h-14 items-center justify-between rounded-full px-6 text-xl font-bold ${
                      isActive ? 'bg-[#3A1410] text-[#FFF6EA]' : 'bg-[#FFF6EA] text-[#3A1410]'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="vn-menu-item mt-3 grid grid-cols-2 gap-2" style={{ '--i': links.length }}>
            <Link
              to="/cart"
              tabIndex={open ? 0 : -1}
              className="vn-press flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F7A81B] text-sm font-bold text-[#3A1410]"
            >
              <CartIcon />
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  tabIndex={open ? 0 : -1}
                  className="vn-press flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#3A1410] text-sm font-bold text-[#3A1410]"
                >
                  <AccountAvatar
                    src={profile?.avatar_url}
                    firstName={profile?.first_name || user.user_metadata?.first_name}
                    lastName={profile?.last_name || user.user_metadata?.last_name}
                    email={user.email}
                  />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  tabIndex={open ? 0 : -1}
                  className="vn-press flex min-h-12 items-center justify-center rounded-full border-2 border-[#3A1410] text-sm font-bold text-[#3A1410]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                tabIndex={open ? 0 : -1}
                className="vn-press flex min-h-12 items-center justify-center rounded-full border-2 border-[#3A1410] text-sm font-bold text-[#3A1410]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}