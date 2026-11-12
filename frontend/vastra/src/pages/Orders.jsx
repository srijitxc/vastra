import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readTrackedOrders, rememberTrackedOrder } from '../lib/orderTracking'

const API_BASE_URL = import.meta.env.VITE_GROUP_CART_API_URL || '/api'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const orderSteps = [
  { status: 'pending', label: 'Order received' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
]

async function trackOrder(id, phone) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, phone }),
    })
  } catch {
    throw new Error('Could not reach the order server. Check that the backend is running and try again.')
  }

  const responseText = await response.text()
  let body = {}
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      if (response.ok) throw new Error('The order server returned an invalid response.')
    }
  }

  if (!response.ok) {
    throw new Error(body.error || `We could not look up your order (HTTP ${response.status}).`)
  }
  if (!body.order?.id || !Array.isArray(body.order.items)) {
    throw new Error('The order server returned incomplete tracking information.')
  }
  return body.order
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function OrderCard({ order, error, loading, onRefresh }) {
  const currentStep = orderSteps.findIndex((step) => step.status === order.status)
  const isCancelled = order.status === 'cancelled'
  const statusLabel = isCancelled
    ? 'Cancelled'
    : orderSteps.find((step) => step.status === order.status)?.label || 'Status update pending'

  return (
    <article className="rounded-2xl border border-[#3A1410]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3A1410]/55">Order placed {formatDate(order.createdAt)}</p>
          <h2 className="mt-1 break-all text-sm font-bold">{order.id}</h2>
        </div>
        <p className={`rounded-full px-4 py-2 text-sm font-bold ${isCancelled ? 'bg-rose-100 text-rose-900' : 'bg-[#FBE4DB]'}`}>
          {statusLabel}
        </p>
      </div>

      {isCancelled ? (
        <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">This order has been cancelled.</p>
      ) : (
        <ol aria-label="Order progress" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {orderSteps.map((step, index) => {
            const complete = currentStep >= 0 && index <= currentStep
            const current = index === currentStep
            return (
              <li
                key={step.status}
                aria-current={current ? 'step' : undefined}
                className={`rounded-xl border p-3 text-center text-xs font-semibold ${
                  complete ? 'border-[#17663B] bg-[#DDF3E4] text-[#17663B]' : 'border-[#3A1410]/10 bg-[#FFF6EA] text-[#3A1410]/55'
                }`}
              >
                <span className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full border border-current text-sm">
                  {complete && index < currentStep ? '✓' : index + 1}
                </span>
                {step.label}
              </li>
            )
          })}
        </ol>
      )}

      <dl className="mt-5 grid gap-2 border-t border-[#3A1410]/10 pt-4 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="text-[#3A1410]/60">Payment</dt>
          <dd className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#3A1410]/60">Total</dt>
          <dd className="font-extrabold">{currency.format(order.total)}</dd>
        </div>
      </dl>

      <h3 className="mt-5 text-sm font-bold">Items</h3>
      <ul className="mt-2 divide-y divide-[#3A1410]/10">
        {order.items.map((item, index) => (
          <li key={`${item.id}-${item.size || ''}-${index}`} className="flex justify-between gap-4 py-3 text-sm">
            <span>{item.name}{item.size ? ` · Size ${item.size}` : ''} × {item.quantity}</span>
            <span className="shrink-0 font-semibold">{currency.format(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-900">{error}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#3A1410]/55">
          {order.statusUpdatedAt ? `Status updated ${formatDate(order.statusUpdatedAt)}` : 'Status last checked just now'}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="min-h-10 rounded-full border border-[#3A1410]/20 px-4 text-sm font-semibold transition hover:bg-[#FFF6EA] disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Refresh status'}
        </button>
      </div>
    </article>
  )
}

export default function Orders() {
  const [history, setHistory] = useState(readTrackedOrders)
  const trackedOrders = history.orders
  const [orders, setOrders] = useState({})
  const [orderErrors, setOrderErrors] = useState({})
  const [loadingIds, setLoadingIds] = useState([])
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  const refreshOrder = useCallback(async (savedOrder) => {
    setLoadingIds((current) => current.includes(savedOrder.id) ? current : [...current, savedOrder.id])
    setOrderErrors((current) => ({ ...current, [savedOrder.id]: '' }))
    try {
      const order = await trackOrder(savedOrder.id, savedOrder.phone)
      setOrders((current) => ({ ...current, [savedOrder.id]: order }))
    } catch (error) {
      setOrderErrors((current) => ({
        ...current,
        [savedOrder.id]: error instanceof Error ? error.message : 'Order status could not be loaded.',
      }))
    } finally {
      setLoadingIds((current) => current.filter((id) => id !== savedOrder.id))
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadTrackedOrders() {
      const results = await Promise.all(
        trackedOrders.map(async (savedOrder) => {
          try {
            return { id: savedOrder.id, order: await trackOrder(savedOrder.id, savedOrder.phone), error: '' }
          } catch (error) {
            return {
              id: savedOrder.id,
              order: null,
              error: error instanceof Error ? error.message : 'Order status could not be loaded.',
            }
          }
        }),
      )
      if (!active) return

      setOrders((current) => {
        const next = { ...current }
        for (const result of results) {
          if (result.order) next[result.id] = result.order
        }
        return next
      })
      setOrderErrors((current) => {
        const next = { ...current }
        for (const result of results) next[result.id] = result.error
        return next
      })
    }

    loadTrackedOrders()
    return () => {
      active = false
    }
  }, [trackedOrders])

  async function handleSubmit(event) {
    event.preventDefault()
    setLookupError('')
    setLookingUp(true)
    try {
      const order = await trackOrder(orderId.trim(), phone.trim())
      const savedOrder = { id: order.id, phone: phone.trim() }
      setOrders((current) => ({ ...current, [order.id]: order }))
      setOrderErrors((current) => ({ ...current, [order.id]: '' }))
      setOrderId('')
      setPhone('')
      try {
        setHistory({ orders: rememberTrackedOrder(order.id, savedOrder.phone), error: '' })
      } catch (storageError) {
        setHistory((current) => ({
          ...current,
          orders: [savedOrder, ...current.orders.filter((item) => item.id !== savedOrder.id)],
        }))
        setLookupError(storageError.message)
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Order could not be looked up.')
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl py-8 text-[#3A1410]" aria-labelledby="orders-title">
      <div className="rounded-[2rem] bg-[#FFF6EA] p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Your Vastra orders</p>
        <h1 id="orders-title" className="mt-2 font-serif text-4xl font-extrabold sm:text-5xl">Order history & tracking</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#3A1410]/70">
          Orders you place in this browser appear here automatically. Refresh a status to see the latest update.
        </p>

        {history.error ? (
          <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-5 text-rose-900">
            {history.error} New orders may not be remembered on this device.
          </p>
        ) : null}

        <div className="mt-7 space-y-4">
          {trackedOrders.map((savedOrder) => (
            orders[savedOrder.id] ? (
              <OrderCard
                key={savedOrder.id}
                order={orders[savedOrder.id]}
                error={orderErrors[savedOrder.id]}
                loading={loadingIds.includes(savedOrder.id)}
                onRefresh={() => refreshOrder(savedOrder)}
              />
            ) : (
              <article key={savedOrder.id} className="rounded-2xl border border-[#3A1410]/10 bg-white p-5">
                <p className="break-all text-sm font-bold">{savedOrder.id}</p>
                {orderErrors[savedOrder.id] ? (
                  <p role="alert" className="mt-3 text-sm text-rose-800">{orderErrors[savedOrder.id]}</p>
                ) : (
                  <p className="mt-3 text-sm text-[#3A1410]/65">Loading current order status…</p>
                )}
                <button
                  type="button"
                  onClick={() => refreshOrder(savedOrder)}
                  disabled={loadingIds.includes(savedOrder.id)}
                  className="mt-3 min-h-10 rounded-full border border-[#3A1410]/20 px-4 text-sm font-semibold disabled:opacity-60"
                >
                  {loadingIds.includes(savedOrder.id) ? 'Refreshing…' : 'Try again'}
                </button>
              </article>
            )
          ))}
          {trackedOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#3A1410]/25 bg-white/70 p-6 text-sm text-[#3A1410]/70">
              No orders yet. Once you place an order, it will show up here.
            </p>
          ) : null}
        </div>

        <details className="mt-8 rounded-2xl border border-[#3A1410]/15 bg-white p-5">
          <summary className="cursor-pointer text-sm font-bold">Track another order</summary>
          <p className="mt-3 text-sm leading-6 text-[#3A1410]/70">
            Enter the full order number and the 10-digit phone number used at checkout.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2" htmlFor="tracking-order-id">
              Order number
              <input
                id="tracking-order-id"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                autoComplete="off"
                required
                maxLength={36}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-[#3A1410]/15 px-4 text-sm font-normal outline-none focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
                placeholder="Paste the full order number"
              />
            </label>
            <label className="text-sm font-semibold" htmlFor="tracking-phone">
              Checkout phone number
              <input
                id="tracking-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                pattern="[6-9][0-9]{9}"
                title="Enter the 10-digit Indian mobile number used at checkout"
                required
                maxLength={10}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-[#3A1410]/15 px-4 text-sm font-normal outline-none focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]"
                placeholder="10-digit number"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={lookingUp}
                className="min-h-12 w-full rounded-full bg-[#3A1410] px-6 text-sm font-bold text-white transition hover:bg-[#065f46] disabled:cursor-wait disabled:opacity-60"
              >
                {lookingUp ? 'Looking up order…' : 'Add to my orders'}
              </button>
            </div>
          </form>
          {lookupError ? (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-900">
              {lookupError}
            </p>
          ) : null}
        </details>

        <Link to="/products" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    </section>
  )
}
