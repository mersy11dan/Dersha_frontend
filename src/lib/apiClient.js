const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const TOKEN_STORAGE_KEY = 'dersha.auth.token'

/**
 * Error thrown for any non-2xx response.
 *
 * Carries the server's machine-readable `code` and per-field `errors` so forms
 * can highlight the offending input instead of showing a generic banner.
 */
export class ApiError extends Error {
  constructor(status, code, message, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors ?? []
  }

  /** Maps the server's field errors into a `{ fieldName: message }` object. */
  get fieldErrors() {
    return this.errors.reduce((acc, item) => {
      if (item.field) acc[item.field] = item.message
      return acc
    }, {})
  }
}

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
      else localStorage.removeItem(TOKEN_STORAGE_KEY)
    } catch {
      // Private browsing modes can block storage; the session still works
      // in-memory for its lifetime.
    }
  },
  clear() {
    this.set(null)
  },
}

/** Notified when the server rejects our token, so the app can log out. */
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

async function request(method, path, { body, auth = true, signal } = {}) {
  const token = auth ? tokenStorage.get() : null

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
    )
  }

  // 204 and other empty bodies must not go through response.json().
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized?.()

    throw new ApiError(
      response.status,
      payload.code ?? 'REQUEST_FAILED',
      payload.message ?? 'Something went wrong. Please try again.',
      payload.errors,
    )
  }

  return payload.data ?? payload
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}

/**
 * Builds the idempotency key the wallet endpoints require.
 * Generated client-side so a double-submitted form cannot fund twice.
 */
export function idempotencyKey(kind) {
  const uuid =
    globalThis.crypto?.randomUUID?.() ??
    // Fallback for non-secure contexts, where crypto.randomUUID is unavailable.
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  return `IDEM-${kind}-${uuid}`
}
