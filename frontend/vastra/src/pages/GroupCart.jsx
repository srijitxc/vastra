import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useGroupCart } from '../context/useGroupCart'
import { useCatalog } from '../context/useCatalog'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const filters = [
  { id: 'all', label: 'Everything' },
  { id: 'like', label: 'Likes' },
  { id: 'bought', label: 'Bought' },
]

export default function GroupCart() {
  const { products } = useCatalog()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    activeGroup,
    group,
    items,
    loading,
    error,
    createGroup,
    joinGroup,
    addToGroupCart,
    updateGroupItem,
    removeFromGroupCart,
    leaveGroup,
    retryGroupLoad,
    clearError,
  } = useGroupCart()
  const [productId, setProductId] = useState(() => searchParams.get('product') || products[0]?.id || '')
  const [groupName, setGroupName] = useState("Friends' finds")
  const [memberName, setMemberName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [status, setStatus] = useState('like')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('all')
  const [announcement, setAnnouncement] = useState('')

  const visibleItems = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  )

  async function handleCreateGroup(event) {
    event.preventDefault()
    await createGroup({ name: groupName, memberName })
  }

  async function handleJoinGroup(event) {
    event.preventDefault()
    await joinGroup({ inviteCode, memberName })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const product = products.find((item) => item.id === productId)
    if (!product) return

    const added = await addToGroupCart(product, { status, note })
    if (added) {
      setNote('')
      setAnnouncement(`${product.name} added to the group cart`)
    }
  }

  async function handleStatusChange(item, nextStatus) {
    await updateGroupItem(item.entryId, { status: nextStatus })
  }

  async function handleRemove(item) {
    const removed = await removeFromGroupCart(item.entryId)
    if (removed) setAnnouncement(`${item.name} removed from the group cart`)
  }

  function handleAddToMyCart(item) {
    navigate(`/products?product=${encodeURIComponent(item.id)}`)
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      setAnnouncement('Invite code copied')
    } catch {
      setAnnouncement(`Invite code: ${group.inviteCode}. Select and copy it to share.`)
    }
  }

  return (
    <section className="py-8 text-[#3A1410]" aria-labelledby="group-cart-title">
      <div className="rounded-[2rem] bg-[#FFF6EA] p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3122A]">For your circle</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 id="group-cart-title" className="font-serif text-4xl font-extrabold tracking-tight sm:text-5xl">
              Group cart
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#3A1410]/75 sm:text-base">
              Keep the pieces your friends love in one place. Share a like or purchase, leave a note, and find it here later.
            </p>
          </div>
          {group ? (
            <span className="w-fit rounded-full border border-[#3A1410]/15 bg-white px-4 py-2 text-sm font-semibold">
              {items.length} {items.length === 1 ? 'share' : 'shares'}
            </span>
          ) : null}
        </div>
        {group ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4">
            <div className="mr-auto">
              <p className="font-bold">{group.name}</p>
              <p className="mt-1 text-xs text-[#3A1410]/65">{group.members.length} group {group.members.length === 1 ? 'member' : 'members'}</p>
            </div>
            <span className="rounded-full bg-[#FBE4DB] px-4 py-2 text-xs font-bold tracking-widest">
              CODE: {group.inviteCode}
            </span>
            <button type="button" onClick={handleCopyCode} className="min-h-10 rounded-full border border-[#3A1410]/20 px-4 text-xs font-bold hover:bg-white">
              Copy invite code
            </button>
            <button type="button" onClick={leaveGroup} className="min-h-10 rounded-full px-3 text-xs font-semibold text-[#3A1410]/65 underline underline-offset-4">
              Switch group
            </button>
          </div>
        ) : null}
        <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
        {error ? (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFE1E3] px-4 py-3 text-sm font-medium">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="rounded-full px-3 py-1 font-bold underline underline-offset-2">
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p role="status" className="mt-8 rounded-2xl bg-[#FFF6EA] p-6 text-center font-medium">Loading your group cart…</p>
      ) : activeGroup && !group ? (
        <div className="mt-7 rounded-[1.75rem] border border-[#3A1410]/10 bg-[#FFF6EA] p-8 text-center">
          <h2 className="font-serif text-2xl font-bold">Can’t load {activeGroup.name}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A1410]/70">
            Check your connection and make sure the group cart server is available, then try again.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={retryGroupLoad} className="min-h-11 rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA]">
              Try again
            </button>
            <button type="button" onClick={leaveGroup} className="min-h-11 rounded-full border border-[#3A1410]/20 px-5 text-sm font-bold">
              Switch group
            </button>
          </div>
        </div>
      ) : !activeGroup ? (
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <form onSubmit={handleCreateGroup} className="rounded-[1.75rem] border border-[#3A1410]/10 bg-[#FBE4DB] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B3122A]">Start a circle</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Create a group</h2>
            <p className="mt-2 text-sm leading-6 text-[#3A1410]/70">Give your group a name, then share its invite code with friends.</p>
            <label htmlFor="create-group-name" className="mt-5 block text-sm font-semibold">Group name</label>
            <input id="create-group-name" required maxLength={60} value={groupName} onChange={(event) => setGroupName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm" />
            <label htmlFor="create-member-name" className="mt-4 block text-sm font-semibold">Your name</label>
            <input id="create-member-name" required maxLength={40} value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="How friends know you" className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm" />
            <button type="submit" className="mt-5 min-h-12 w-full rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA] transition hover:bg-[#5a211b]">
              Create group
            </button>
          </form>

          <form onSubmit={handleJoinGroup} className="rounded-[1.75rem] border border-[#3A1410]/10 bg-[#FFF6EA] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B3122A]">Already invited?</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Join a group</h2>
            <p className="mt-2 text-sm leading-6 text-[#3A1410]/70">Enter the invite code your friend shared with you.</p>
            <label htmlFor="join-invite-code" className="mt-5 block text-sm font-semibold">Invite code</label>
            <input id="join-invite-code" required maxLength={12} value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="e.g. 8F3K2M9P" className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm uppercase tracking-widest" />
            <label htmlFor="join-member-name" className="mt-4 block text-sm font-semibold">Your name</label>
            <input id="join-member-name" required maxLength={40} value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="How friends know you" className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm" />
            <button type="submit" className="mt-5 min-h-12 w-full rounded-full border-2 border-[#3A1410] px-5 text-sm font-bold text-[#3A1410] transition hover:bg-white">
              Join group
            </button>
          </form>
          <p className="md:col-span-2 text-center text-xs leading-5 text-[#3A1410]/60">
            Anyone with the invite code can join and manage this group. Only share the code with people you trust.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter group cart">
              {filters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={filter === option.id}
                  className={`min-h-11 rounded-full border-2 px-5 text-sm font-bold transition ${
                    filter === option.id
                      ? 'border-[#3A1410] bg-[#3A1410] text-[#FFF6EA]'
                      : 'border-[#3A1410]/20 bg-white text-[#3A1410] hover:bg-[#FFF6EA]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {visibleItems.length ? (
              <div className="mt-5 space-y-4">
                {visibleItems.map((item) => (
                  <article key={item.entryId} className="grid gap-4 rounded-[1.75rem] border border-[#3A1410]/10 bg-white p-4 shadow-sm sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="aspect-square w-full rounded-2xl bg-[#FFF6EA] object-cover sm:aspect-4/5"
                      style={{ objectPosition: item.imagePosition }}
                    />
                    <div className="flex min-w-0 flex-col">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3A1410]/60">
                            {item.section} · {item.category}
                          </p>
                          <h2 className="mt-1 text-xl font-bold">{item.name}</h2>
                        </div>
                        <p className="font-bold">{currency.format(item.price)}</p>
                      </div>

                      <p className="mt-3 text-sm text-[#3A1410]/75">
                        Shared by <span className="font-semibold text-[#3A1410]">{item.sharedBy}</span>
                        {' · '}
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(item.sharedAt))}
                      </p>
                      {item.note ? <p className="mt-3 rounded-xl bg-[#FFF6EA] px-4 py-3 text-sm">“{item.note}”</p> : null}

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <label className="sr-only" htmlFor={`status-${item.entryId}`}>Status for {item.name}</label>
                        <select
                          id={`status-${item.entryId}`}
                          value={item.status}
                          onChange={(event) => handleStatusChange(item, event.target.value)}
                          className="min-h-11 rounded-full border border-[#3A1410]/20 bg-[#FFF6EA] px-4 text-sm font-semibold"
                        >
                          <option value="like">I like this</option>
                          <option value="bought">I bought this</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddToMyCart(item)}
                          className="min-h-11 rounded-full bg-[#F7A81B] px-5 text-sm font-bold text-[#3A1410] transition hover:bg-[#f5b83d]"
                        >
                          Choose size
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          className="min-h-11 rounded-full px-4 text-sm font-semibold text-[#3A1410]/65 underline underline-offset-4 hover:text-[#B3122A]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.75rem] border-2 border-dashed border-[#3A1410]/20 bg-[#FFF6EA]/60 px-6 py-14 text-center">
                <p className="font-serif text-2xl font-bold">
                  {items.length ? 'Nothing in this view yet' : 'Your group’s first share starts here'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A1410]/70">
                  {items.length
                    ? 'Try another filter to see the rest of the group’s saved pieces.'
                    : 'Add a product with the form, or explore the collection and share a favorite.'}
                </p>
                {!items.length ? (
                  <Link to="/products" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#3A1410] px-6 text-sm font-bold text-[#FFF6EA]">
                    Browse products
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <aside className="rounded-[1.75rem] border border-[#3A1410]/10 bg-[#FBE4DB] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B3122A]">Add a share</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Save it for everyone</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="group-product" className="text-sm font-semibold">Product</label>
                <select
                  id="group-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="share-status" className="text-sm font-semibold">What are you sharing?</label>
                <select
                  id="share-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#3A1410]/20 bg-white px-3 text-sm"
                >
                  <option value="like">I like this</option>
                  <option value="bought">I bought this</option>
                </select>
              </div>
              <div>
                <label htmlFor="share-note" className="text-sm font-semibold">Note <span className="font-normal text-[#3A1410]/60">(optional)</span></label>
                <textarea
                  id="share-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={180}
                  rows={3}
                  placeholder="Tell your group why you saved it..."
                  className="mt-2 w-full resize-y rounded-xl border border-[#3A1410]/20 bg-white p-3 text-sm"
                />
              </div>
              <button type="submit" className="min-h-12 w-full rounded-full bg-[#3A1410] px-5 text-sm font-bold text-[#FFF6EA] transition hover:bg-[#5a211b]">
                Add to group cart
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-[#3A1410]/65">
              Group items are shared with everyone who has this invite code. Add only details you’re comfortable sharing.
            </p>
          </aside>
        </div>
      )}
    </section>
  )
}
