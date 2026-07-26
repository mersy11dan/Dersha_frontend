import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the API and keeps it fresh.
 *
 * `reload` refetches without clearing what is already on screen, so a live
 * update or a user action does not flash the page back to a spinner.
 */
export function useAsyncData(loader, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const loaderRef = useRef(loader)
  loaderRef.current = loader

  // Guards against a slow first request resolving after a newer one.
  const requestId = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current
    if (!silent) setLoading(true)
    setError(null)

    try {
      const result = await loaderRef.current()
      if (mounted.current && id === requestId.current) setData(result)
      return result
    } catch (caught) {
      if (mounted.current && id === requestId.current) setError(caught)
      return null
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    data,
    loading,
    error,
    reload: () => run({ silent: true }),
    refetch: () => run(),
    setData,
  }
}
