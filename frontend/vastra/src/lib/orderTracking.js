const TRACKED_ORDERS_KEY = 'vastra:tracked-orders'

export function readTrackedOrders() {
  try {
    const saved = window.localStorage.getItem(TRACKED_ORDERS_KEY)
    if (!saved) return { orders: [], error: '' }

    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) throw new Error('Saved order history has an invalid format.')

    const orders = parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.phone === 'string' &&
        /^[6-9]\d{9}$/.test(item.phone),
    )
    return { orders, error: '' }
  } catch (error) {
    return {
      orders: [],
      error: error instanceof Error ? error.message : 'Saved order history could not be read.',
    }
  }
}

export function rememberTrackedOrder(id, phone) {
  const { orders, error } = readTrackedOrders()
  if (error) throw new Error(error)

  const nextOrders = [{ id, phone }, ...orders.filter((item) => item.id !== id)].slice(0, 50)
  try {
    window.localStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(nextOrders))
  } catch {
    throw new Error('Your order was placed, but this browser could not save it to your order history.')
  }
  return nextOrders
}
