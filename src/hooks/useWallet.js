import { useCallback, useEffect, useRef, useState } from 'react'
import { walletService } from '../lib/services'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 20

/**
 * Live wallet balance and transaction history.
 *
 * Deposits settle asynchronously (the payment switch calls back after the user
 * authorises in their wallet app), so while anything is in flight this polls
 * until it reaches a terminal state and then stops.
 */
export function useWallet() {
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pollAttempts = useRef(0)
  const timerRef = useRef(null)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const [nextBalance, nextTransactions] = await Promise.all([
        walletService.balance(),
        walletService.transactions(25),
      ])
      setBalance(nextBalance)
      setTransactions(nextTransactions)
      setError(null)
      return { balance: nextBalance, transactions: nextTransactions }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => clearTimeout(timerRef.current)
  }, [load])

  /** Refreshes until every pending transaction settles, then stops. */
  const trackPending = useCallback(() => {
    clearTimeout(timerRef.current)
    pollAttempts.current = 0

    const tick = async () => {
      pollAttempts.current += 1
      const result = await load({ quiet: true })

      const stillPending = (result?.transactions ?? []).some((tx) =>
        ['PROCESSING', 'ESCROWED', 'PENDING_BANK_VERIFICATION'].includes(tx.status),
      )

      if (stillPending && pollAttempts.current < MAX_POLL_ATTEMPTS) {
        timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
      }
    }

    timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
  }, [load])

  return { balance, transactions, loading, error, reload: load, trackPending }
}

export function formatEtb(value, { withSuffix = true } = {}) {
  const amount = Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return withSuffix ? `${amount} ETB` : amount
}
