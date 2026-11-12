import { useContext } from 'react'
import { GroupCartContext } from './groupCartStore'

export function useGroupCart() {
  const groupCart = useContext(GroupCartContext)

  if (!groupCart) {
    throw new Error('useGroupCart must be used within a GroupCartProvider')
  }

  return groupCart
}
