import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addToCart = useCallback((product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id && (item.size || '') === (product.size || ''),
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id && (item.size || '') === (product.size || '')
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentItems, { ...product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId, size = null) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId || (item.size || '') !== (size || '')),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const cartValue = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
      addToCart,
      removeFromCart,
      clearCart,
    }),
    [items, addToCart, removeFromCart, clearCart],
  )

  return <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)

  if (!cart) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return cart
}
