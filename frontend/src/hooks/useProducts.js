import { useState, useEffect } from 'react'
import { getProducts } from '../services/api'

// Loads the (mock) product catalog once when the app mounts.
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false // avoid setting state after unmount
    getProducts()
      .then((data) => { if (!cancelled) setProducts(data.products) })
      .catch((err) => { if (!cancelled) setError({ message: err.message, details: [] }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { products, loading, error }
}
