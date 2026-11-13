import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { API_BASE_URL } from '../lib/apiConfig'
import { rememberTrackedOrder } from '../lib/orderTracking'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inputClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-[#3A1410]/15 bg-white px-4 text-sm text-[#3A1410] outline-none transition focus:border-[#9A3D25] focus:ring-2 focus:ring-[#E8B58E]'

async function submitOrder(order) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
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
    throw new Error(body.error || `We could not place your order (HTTP ${response.status}).`)
  }
  if (!body.order?.id) throw new Error('The order server did not confirm the order.')
  return { ...body.order, notifications: body.notifications || { email: 'not_configured', sms: 'not_configured' } }
}

function OrderConfirmation({ order, trackingError }) {
  const notificationLabel = (channel, status) => {
    if (status === 'sent') return `${channel} confirmation sent`
    if (status === 'failed') return `${channel} confirmation could not be sent`
    return `${channel} confirmation is not configured`
  }

  return (
    <section className="mx-auto max-w-2xl py-10" aria-labelledby="order-confirmation-title">
      <div className="rounded-[2rem] bg-[#FFF6EA] p-6 text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#DDF3E4] text-3xl font-bold text-[#17663B]" aria-hidden="true">✓</span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#17663B]">Order received</p>
        <h1 id="order-confirmation-title" className="mt-2 font-serif text-4xl font-extrabold text-[#3A1410]">Thank you!</h1>
        <p className="mt-3 text-sm leading-6 text-[#3A1410]/70">
          Your cash-on-delivery order has been saved. Pay the delivery person when it arrives.
        </p>
        <div className="mt-7 rounded-2xl bg-white p-5 text-left">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-[#3A1410]/60">Order number</span>
            <span className="break-all text-right font-bold">{order.id}</span>
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-[#3A1410]/60">Payment</span>
            <span className="font-semibold">Cash on delivery</span>
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[#3A1410]/10 pt-3 text-sm">
            <span className="font-bold">Pay on delivery</span>
            <span className="font-bold text-[#B3122A]">{currency.format(order.total)}</span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[#3A1410]/10 bg-white/70 p-4 text-left">
          <h2 className="text-sm font-bold">Order confirmations</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#3A1410]/75">
            <li>{notificationLabel('Email', order.notifications.email)}{order.notifications.email === 'sent' ? ` to ${order.customer.email}` : ''}</li>
            <li>{notificationLabel('SMS', order.notifications.sms)}{order.notifications.sms === 'sent' ? ` to ${order.customer.phone}` : ''}</li>
          </ul>
          {(order.notifications.email !== 'sent' || order.notifications.sms !== 'sent') ? (
            <p className="mt-2 text-xs leading-5 text-[#3A1410]/60">
              Your order is saved. The confirmation appears here even if a message could not be delivered.
            </p>
          ) : null}
        </div>
        {trackingError ? (
          <p role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm leading-5 text-amber-950">
            {trackingError} Save the full order number above to track it later.
          </p>
        ) : null}
        <Link
          to="/orders"
          state={{ orderId: order.id, phone: order.customer.phone }}
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#3A1410] px-7 text-sm font-bold text-white transition hover:bg-[#065f46]"
        >
          Track this order
        </Link>
        <Link to="/products" className="mt-3 inline-flex min-h-12 items-center justify-center px-7 text-sm font-bold text-[#3A1410] underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    </section>
  )
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const [trackingError, setTrackingError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const orderDetails = {
      customer: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
      },
      address: {
        line1: formData.get('addressLine1'),
        line2: formData.get('addressLine2'),
        city: formData.get('city'),
        state: formData.get('state'),
        postalCode: formData.get('postalCode'),
        instructions: formData.get('instructions'),
      },
      paymentMethod: 'cod',
      items: items.map((item) => ({ id: item.id, quantity: item.quantity, size: item.size || '' })),
    }

    try {
      const savedOrder = await submitOrder(orderDetails)
      try {
        rememberTrackedOrder(savedOrder.id, savedOrder.customer.phone)
      } catch (storageError) {
        setTrackingError(storageError.message)
      }
      setOrder(savedOrder)
      clearCart()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (order) return <OrderConfirmation order={order} trackingError={trackingError} />

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl py-10 text-center">
        <div className="rounded-[2rem] bg-[#FFF6EA] px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Checkout</p>
          <h1 className="mt-2 font-serif text-4xl font-extrabold text-[#3A1410]">Your bag is empty</h1>
          <p className="mt-3 text-sm text-[#3A1410]/70">Add a piece to your cart before checking out.</p>
          <Link to="/products" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#3A1410] px-7 text-sm font-bold text-white">
            Explore products
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl py-4 text-[#3A1410]" aria-labelledby="checkout-title">
      <div className="mb-7">
        <Link to="/cart" className="inline-flex min-h-10 items-center text-sm font-semibold text-[#3A1410]/65 hover:text-[#B3122A]">
          ← Back to cart
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">Almost yours</p>
        <h1 id="checkout-title" className="mt-2 font-serif text-4xl font-extrabold sm:text-5xl">Checkout</h1>
        <p className="mt-2 text-sm text-[#3A1410]/65">Add your delivery details and review your order.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-[1.75rem] bg-[#FFF6EA] p-5 sm:p-7" aria-labelledby="delivery-title">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F7A81B] text-sm font-extrabold">1</span>
              <div>
                <h2 id="delivery-title" className="text-lg font-bold">Contact and delivery</h2>
                <p className="text-xs text-[#3A1410]/60">Where should we send your order?</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2" htmlFor="checkout-name">
                Full name
                <input id="checkout-name" name="name" autoComplete="name" required maxLength={80} className={inputClass} />
              </label>
              <label className="text-sm font-semibold" htmlFor="checkout-email">
                Email address
                <input id="checkout-email" name="email" type="email" autoComplete="email" required maxLength={160} className={inputClass} />
              </label>
              <label className="text-sm font-semibold" htmlFor="checkout-phone">
                Mobile number
                <input id="checkout-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" pattern="[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number" placeholder="10-digit number" required className={inputClass} />
              </label>
              <label className="text-sm font-semibold sm:col-span-2" htmlFor="checkout-address-1">
                Address
                <input id="checkout-address-1" name="addressLine1" autoComplete="address-line1" required maxLength={160} placeholder="House number and street" className={inputClass} />
              </label>
              <label className="text-sm font-semibold sm:col-span-2" htmlFor="checkout-address-2">
                Apartment, landmark <span className="font-normal text-[#3A1410]/55">(optional)</span>
                <input id="checkout-address-2" name="addressLine2" autoComplete="address-line2" maxLength={160} className={inputClass} />
              </label>
              <label className="text-sm font-semibold" htmlFor="checkout-city">
                City
                <input id="checkout-city" name="city" autoComplete="address-level2" required maxLength={80} className={inputClass} />
              </label>
              <label className="text-sm font-semibold" htmlFor="checkout-state">
                State
                <input id="checkout-state" name="state" autoComplete="address-level1" required maxLength={80} className={inputClass} />
              </label>
              <label className="text-sm font-semibold" htmlFor="checkout-postal">
                PIN code
                <input id="checkout-postal" name="postalCode" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" title="Enter a 6-digit PIN code" required className={inputClass} />
              </label>
              <label className="text-sm font-semibold sm:col-span-2" htmlFor="checkout-instructions">
                Delivery instructions <span className="font-normal text-[#3A1410]/55">(optional)</span>
                <textarea id="checkout-instructions" name="instructions" maxLength={200} rows={2} placeholder="Anything the delivery person should know?" className={`${inputClass} resize-y py-3`} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-[#FFF6EA] p-5 sm:p-7" aria-labelledby="payment-title">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F7A81B] text-sm font-extrabold">2</span>
              <div>
                <h2 id="payment-title" className="text-lg font-bold">Payment method</h2>
                <p className="text-xs text-[#3A1410]/60">Choose how you would like to pay.</p>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[#3A1410] bg-white p-4">
              <input type="radio" name="payment" value="cod" defaultChecked className="mt-1 h-4 w-4 accent-[#3A1410]" />
              <span>
                <span className="block text-sm font-bold">Cash on delivery</span>
                <span className="mt-1 block text-xs leading-5 text-[#3A1410]/65">Pay in cash when your order arrives.</span>
              </span>
            </label>
            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#3A1410]/10 bg-[#F7F1EA] p-4 opacity-75">
              <span aria-hidden="true" className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#3A1410]/40 text-[10px]">×</span>
              <span>
                <span className="block text-sm font-bold">Pay online</span>
                <span className="mt-1 block text-xs leading-5 text-[#3A1410]/65">Online payments are not set up yet. No payment will be taken.</span>
              </span>
            </div>
          </section>
        </form>

        <aside className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Your order</h2>
          <p className="mt-1 text-xs text-[#3A1410]/60">{items.reduce((count, item) => count + item.quantity, 0)} items</p>
          <ul className="mt-5 max-h-72 space-y-4 overflow-auto">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <img src={item.image} alt="" className="h-16 w-14 shrink-0 rounded-xl bg-[#F7F1EA] object-cover" style={{ objectPosition: item.imagePosition }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-[#3A1410]/60">Qty {item.quantity}{item.size ? ` · Size ${item.size}` : ''}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{currency.format(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-3 border-t border-[#3A1410]/10 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-[#3A1410]/65">Subtotal</span><span>{currency.format(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-[#3A1410]/65">Delivery</span><span className="font-semibold text-[#17663B]">Free</span></div>
            <div className="flex justify-between border-t border-[#3A1410]/10 pt-3 text-base font-extrabold"><span>Total due</span><span>{currency.format(subtotal)}</span></div>
          </div>
          {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-900">{error}</p> : null}
          <button type="submit" form="checkout-form" disabled={submitting} className="mt-5 min-h-12 w-full rounded-full bg-[#3A1410] px-5 text-sm font-bold text-white transition hover:bg-[#065f46] disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Placing order…' : 'Place cash-on-delivery order'}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-[#3A1410]/55">By placing your order, you agree to pay the total on delivery.</p>
          <Link to="/cart" className="mt-4 inline-flex min-h-10 w-full items-center justify-center text-sm font-semibold text-[#3A1410]/70 underline underline-offset-4">
            Return to cart
          </Link>
        </aside>
      </div>
    </section>
  )
}
