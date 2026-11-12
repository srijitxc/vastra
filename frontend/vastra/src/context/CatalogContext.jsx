import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { products as baseProducts } from '../data/catalog'

const API_BASE_URL = import.meta.env.VITE_GROUP_CART_API_URL || '/api'
const CatalogContext = createContext(null)

async function fetchManagedCatalog() {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/catalog`)
  } catch {
    throw new Error('Could not reach the catalog server. In a separate terminal run: Set-Location D:\\2\\Ecorweb\\backend; npm run dev')
  }

  const responseText = await response.text()
  let body = {}
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      if (response.ok) throw new Error('The catalog server returned an invalid response.')
    }
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503) {
      throw new Error('Catalog API is offline. In a separate terminal run: Set-Location D:\\2\\Ecorweb\\backend; npm run dev')
    }
    throw new Error(body.error || `Catalog could not be loaded (HTTP ${response.status}).`)
  }
  if (!Array.isArray(body.addedProducts) || !Array.isArray(body.removedIds)) {
    throw new Error('The catalog server returned an invalid response.')
  }
  return body
}

export function CatalogProvider({ children }) {
  const [managedProducts, setManagedProducts] = useState({ addedProducts: [], removedIds: [] })
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current
    try {
      const body = await fetchManagedCatalog()
      if (currentRequestId !== requestId.current) return
      setManagedProducts(body)
      setError('')
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return
      setError(requestError instanceof Error ? requestError.message : 'Managed products could not be loaded.')
    }
  }, [])

  useEffect(() => {
    let active = true
    const initialRequestId = ++requestId.current
    async function loadCatalog() {
      try {
        const body = await fetchManagedCatalog()
        if (active && initialRequestId === requestId.current) {
          setManagedProducts(body)
          setError('')
        }
      } catch (requestError) {
        if (active && initialRequestId === requestId.current) {
          setError(requestError instanceof Error ? requestError.message : 'Managed products could not be loaded.')
        }
      }
    }
    loadCatalog()
    return () => {
      active = false
    }
  }, [])

  const catalog = useMemo(() => {
    const removed = new Set(managedProducts.removedIds)
    return [
      ...baseProducts.filter((product) => !removed.has(product.id)),
      ...managedProducts.addedProducts
        .filter((product) => !removed.has(product.id))
        .map((product) => ({ ...product, image: product.image || baseProducts[0]?.image || '' })),
    ]
  }, [managedProducts])

  const value = useMemo(() => ({ products: catalog, error, refresh }), [catalog, error, refresh])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used within a CatalogProvider')
  return context
}
