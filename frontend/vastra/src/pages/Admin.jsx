import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '../context/useCatalog'
import { adminLogin, adminRequest, clearAdminSession, hasAdminSession } from '../lib/adminApi'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const tabs = ['Overview', 'Products', 'Orders', 'Payments']
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-[#3A1410]/15 bg-white px-3 text-sm outline-none focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function Metric({ label, value, tone = 'bg-white' }) {
  return (
    <article className={`rounded-2xl border border-[#3A1410]/10 p-5 ${tone}`}>
      <p className="text-sm font-medium text-[#3A1410]/65">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </article>
  )
}

export default function Admin() {
  const { refresh: refreshCatalog } = useCatalog()
  const [authenticated, setAuthenticated] = useState(hasAdminSession)
  const [tab, setTab] = useState('Overview')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    section: 'Women',
    price: '',
    sizes: 'S, M, L, XL',
    image: '',
  })

  useEffect(() => {
    if (!authenticated) return undefined
    let active = true

    async function loadDashboard() {
      try {
        const [productResult, orderResult] = await Promise.all([
          adminRequest('/admin/products'),
          adminRequest('/admin/orders'),
        ])
        if (active) {
          setProducts(productResult.products)
          setOrders(orderResult.orders)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded.')
          if (!hasAdminSession()) setAuthenticated(false)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [authenticated, refreshKey])

  const totals = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'cancelled')
    const paymentsDue = activeOrders
      .filter((order) => (order.paymentStatus || 'due') === 'due')
      .reduce((sum, order) => sum + order.total, 0)
    const paymentsReceived = orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.total, 0)
    return {
      orderCount: orders.length,
      activeCount: activeOrders.length,
      paymentsDue,
      paymentsReceived,
    }
  }, [orders])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setError('')
    setLoginLoading(true)
    try {
      await adminLogin(email.trim(), password)
      setPassword('')
      setLoading(true)
      setAuthenticated(true)
    } catch (requestError) {
      setLoginError(requestError instanceof Error ? requestError.message : 'Admin login failed.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleAddProduct(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSavingProduct(true)
    try {
      const result = await adminRequest('/admin/products', {
        method: 'POST',
        body: { ...productForm, price: Number(productForm.price) },
      })
      setProducts((current) => [result.product, ...current])
      await refreshCatalog()
      setProductForm({ name: '', category: '', section: 'Women', price: '', sizes: 'S, M, L, XL', image: '' })
      setNotice(`${result.product.name} was added to the catalog.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Product could not be added.')
      if (!hasAdminSession()) setAuthenticated(false)
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleRemoveProduct(product) {
    if (!window.confirm(`Remove "${product.name}" from the storefront?`)) return
    setError('')
    setNotice('')
    try {
      await adminRequest(`/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' })
      setProducts((current) => current.filter((item) => item.id !== product.id))
      await refreshCatalog()
      setNotice(`${product.name} was removed from the catalog.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Product could not be removed.')
      if (!hasAdminSession()) setAuthenticated(false)
    }
  }

  async function updateOrder(order, path, body) {
    setError('')
    setNotice('')
    try {
      const result = await adminRequest(`/admin/orders/${encodeURIComponent(order.id)}/${path}`, {
        method: 'PATCH',
        body,
      })
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item))
      setNotice(`Order ${order.id.slice(0, 8).toUpperCase()} was updated.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Order could not be updated.')
      if (!hasAdminSession()) setAuthenticated(false)
    }
  }

  function signOut() {
    clearAdminSession()
    setAuthenticated(false)
    setProducts([])
    setOrders([])
  }

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-md py-12 text-[#3A1410]" aria-labelledby="admin-login-title">
        <div className="rounded-[2rem] bg-[#FFF6EA] p-7 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Store management</p>
          <h1 id="admin-login-title" className="mt-2 font-serif text-4xl font-extrabold">Admin portal</h1>
          <p className="mt-3 text-sm leading-6 text-[#3A1410]/70">Sign in with the admin credentials configured on the backend.</p>
          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <label htmlFor="admin-email" className="block text-sm font-semibold">
              Admin email
              <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </label>
            <label htmlFor="admin-password" className="block text-sm font-semibold">
              Password
              <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </label>
            {loginError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{loginError}</p> : null}
            <button type="submit" disabled={loginLoading} className="min-h-12 w-full rounded-full bg-[#3A1410] px-5 text-sm font-bold text-white disabled:opacity-60">
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  const visibleOrders = tab === 'Payments'
    ? orders.filter((order) => order.paymentMethod === 'cod')
    : orders

  return (
    <section className="mx-auto max-w-6xl py-6 text-[#3A1410]" aria-labelledby="admin-title">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Vastra store management</p>
          <h1 id="admin-title" className="mt-2 font-serif text-4xl font-extrabold sm:text-5xl">Admin portal</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setError(''); setLoading(true); setRefreshKey((current) => current + 1) }} disabled={loading} className="min-h-11 rounded-full border border-[#3A1410]/20 px-4 text-sm font-semibold disabled:opacity-60">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" onClick={signOut} className="min-h-11 rounded-full bg-[#3A1410] px-5 text-sm font-semibold text-white">Sign out</button>
        </div>
      </header>

      <nav aria-label="Admin sections" className="mt-7 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tab === item}
            onClick={() => setTab(item)}
            className={`min-h-11 rounded-full px-5 text-sm font-bold ${tab === item ? 'bg-[#3A1410] text-white' : 'border border-[#3A1410]/20 bg-white'}`}
          >
            {item}
          </button>
        ))}
      </nav>

      {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-5 text-rose-900">{error}</p> : null}
      {notice ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p> : null}

      {tab === 'Overview' ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="All orders" value={totals.orderCount} />
            <Metric label="Active orders" value={totals.activeCount} tone="bg-[#FFE7A3]" />
            <Metric label="Payments due (COD)" value={currency.format(totals.paymentsDue)} tone="bg-[#FFD6D9]" />
            <Metric label="Payments received" value={currency.format(totals.paymentsReceived)} tone="bg-[#DDF3E4]" />
          </div>
          <div className="mt-6 rounded-2xl bg-white p-5">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <div className="mt-3 divide-y divide-[#3A1410]/10">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <span className="font-semibold">{order.customer.name} · {order.id.slice(0, 8).toUpperCase()}</span>
                  <span>{order.status} · {currency.format(order.total)}</span>
                </div>
              ))}
              {orders.length === 0 ? <p className="py-4 text-sm text-[#3A1410]/60">No orders have been placed yet.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Products' ? (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-2xl bg-white p-5">
            <h2 className="text-lg font-bold">Catalog ({products.length})</h2>
            <ul className="mt-3 divide-y divide-[#3A1410]/10">
              {products.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-[#3A1410]/60">{product.section} · {product.category} · {currency.format(product.price)}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveProduct(product)} className="min-h-10 rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-50">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={handleAddProduct} className="rounded-2xl bg-[#FBE4DB] p-5">
            <h2 className="text-lg font-bold">Add a product</h2>
            <label className="mt-4 block text-sm font-semibold">Product name<input required maxLength={160} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} className={inputClass} /></label>
            <label className="mt-3 block text-sm font-semibold">Category<input required maxLength={80} placeholder="Tops, Dresses…" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} className={inputClass} /></label>
            <label className="mt-3 block text-sm font-semibold">Collection
              <select value={productForm.section} onChange={(event) => setProductForm({ ...productForm, section: event.target.value })} className={inputClass}>
                {['Women', 'Men', 'Kids', 'Accessories'].map((section) => <option key={section}>{section}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold">Price (INR)<input type="number" min="1" max="1000000" step="1" required value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className={inputClass} /></label>
            <label className="mt-3 block text-sm font-semibold">Sizes<input required maxLength={80} placeholder="S, M, L, XL" value={productForm.sizes} onChange={(event) => setProductForm({ ...productForm, sizes: event.target.value })} className={inputClass} /></label>
            <label className="mt-3 block text-sm font-semibold">Image URL (optional)<input type="url" maxLength={500} placeholder="https://…" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} className={inputClass} /></label>
            <button type="submit" disabled={savingProduct} className="mt-4 min-h-11 w-full rounded-full bg-[#3A1410] px-5 text-sm font-bold text-white disabled:opacity-60">
              {savingProduct ? 'Adding…' : 'Add product'}
            </button>
          </form>
        </div>
      ) : null}

      {tab === 'Orders' || tab === 'Payments' ? (
        <div className="mt-6 space-y-4">
          {tab === 'Payments' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="COD payments due" value={currency.format(totals.paymentsDue)} tone="bg-[#FFD6D9]" />
              <Metric label="Payments marked received" value={currency.format(totals.paymentsReceived)} tone="bg-[#DDF3E4]" />
            </div>
          ) : null}
          {visibleOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-[#3A1410]/10 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="break-all font-bold">{order.id}</h2>
                  <p className="mt-1 text-sm text-[#3A1410]/65">{formatDate(order.createdAt)} · {order.customer.name} · {order.customer.phone}</p>
                  <p className="mt-1 text-sm text-[#3A1410]/65">{order.customer.email} · {order.address.city}, {order.address.state}</p>
                  <p className="mt-2 font-bold">{currency.format(order.total)} · {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`order-status-${order.id}`}>Status for order {order.id}</label>
                  <select
                    id={`order-status-${order.id}`}
                    value={order.status}
                    onChange={(event) => updateOrder(order, 'status', { status: event.target.value })}
                    className="min-h-10 rounded-full border border-[#3A1410]/20 bg-[#FFF6EA] px-3 text-sm font-semibold"
                  >
                    {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => updateOrder(order, 'payment', { paymentStatus: order.paymentStatus === 'paid' ? 'due' : 'paid' })}
                    disabled={order.status === 'cancelled'}
                    className={`min-h-10 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-[#FFE7A3] text-[#3A1410]'}`}
                  >
                    {order.paymentStatus === 'paid' ? 'Paid · mark due' : 'Payment due · mark paid'}
                  </button>
                </div>
              </div>
              <ul className="mt-4 border-t border-[#3A1410]/10 pt-3 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${item.id}-${item.size || ''}-${index}`} className="flex justify-between gap-3 py-1">
                    <span>{item.name}{item.size ? ` · ${item.size}` : ''} × {item.quantity}</span>
                    <span>{currency.format(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#3A1410]/60">Deliver to: {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state} {order.address.postalCode}</p>
            </article>
          ))}
          {visibleOrders.length === 0 ? <p className="rounded-2xl bg-white p-6 text-sm text-[#3A1410]/65">No {tab.toLowerCase()} to show yet.</p> : null}
        </div>
      ) : null}
    </section>
  )
}
