import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function Cart() {
  const { items, itemCount, subtotal, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <section className="py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
          Your Vastra bag
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Your cart
        </h1>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-slate-700">Your cart is empty.</p>
          <p className="mt-2 text-sm text-slate-500">
            Find something you love in our curated collection.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Browse the collection
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
        Your Vastra bag
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
        Your cart
      </h1>
      <p className="mt-2 text-slate-600">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={`${item.id}-${item.size || ''}`}
              className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:p-5"
            >
              <img
                src={item.image}
                alt={item.imageAlt}
                className="h-32 w-24 shrink-0 rounded-2xl bg-slate-100 object-cover sm:h-40 sm:w-32"
                style={{ objectPosition: item.imagePosition }}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
                    {item.category}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Quantity: {item.quantity}{item.size ? ` · Size ${item.size}` : ''}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="text-sm font-medium text-slate-500 underline underline-offset-4 transition hover:text-rose-700"
                  >
                    Remove
                  </button>
                  <p className="font-bold text-slate-900">
                    {currency.format(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="mt-5 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{currency.format(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Shipping and taxes are calculated at checkout.
          </p>
          <Link
            to="/checkout"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#3A1410] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f46]"
          >
            Continue to checkout
          </Link>
          <Link
            to="/"
            className="mt-4 inline-flex w-full justify-center text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-emerald-800"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  )
}
