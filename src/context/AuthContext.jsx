import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  tokenStorage,
  setUnauthorizedHandler,
} from '../lib/apiClient'
import { authService } from '../lib/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Starts true so guarded routes wait for the session check instead of
  // bouncing an authenticated user to the login screen on first paint.
  const [initialising, setInitialising] = useState(true)

  const applySession = useCallback((token, nextUser) => {
    if (token) tokenStorage.set(token)
    setUser(nextUser ?? null)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStorage.clear()
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // Restore the session from a stored token on page load or refresh.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!tokenStorage.get()) {
        setInitialising(false)
        return
      }

      try {
        const data = await authService.me()
        if (!cancelled) setUser(data.user)
      } catch {
        // Expired or tampered token: drop it and continue as a guest.
        if (!cancelled) tokenStorage.clear()
      } finally {
        if (!cancelled) setInitialising(false)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload)
      applySession(data.token, data.user)
      return data
    },
    [applySession],
  )

  const login = useCallback(
    async (payload) => {
      const data = await authService.login(payload)
      applySession(data.token, data.user)
      return data
    },
    [applySession],
  )

  const refresh = useCallback(async () => {
    const data = await authService.me()
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      initialising,
      isAuthenticated: Boolean(user),
      isVerified: user?.account_status === 'ACTIVE_VERIFIED',
      register,
      login,
      logout,
      refresh,
      applySession,
    }),
    [user, initialising, register, login, logout, refresh, applySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
