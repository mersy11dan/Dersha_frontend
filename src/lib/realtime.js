import { useEffect, useRef, useState } from 'react'

/**
 * Shared connection to the market feed.
 *
 * One socket serves the whole tab: several components can watch the same
 * sub-fund or basket without each opening its own connection, and a topic is
 * only unsubscribed once the last listener for it goes away.
 */
class RealtimeClient {
  constructor() {
    this.socket = null
    /** topic -> Set<handler> */
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.statusHandlers = new Set()
    this.status = 'idle'
  }

  get url() {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    // Vite proxies /ws to the API in development and the same origin serves
    // both in production, so the current host is always correct.
    return `${protocol}://${window.location.host}/ws`
  }

  setStatus(status) {
    this.status = status
    this.statusHandlers.forEach((handler) => handler(status))
  }

  onStatus(handler) {
    this.statusHandlers.add(handler)
    handler(this.status)
    return () => this.statusHandlers.delete(handler)
  }

  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return

    this.setStatus('connecting')

    try {
      this.socket = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.setStatus('open')
      // Re-subscribe: the server keeps subscriptions per connection, so a
      // reconnect starts from nothing.
      this.listeners.forEach((_handlers, topic) => this.send('subscribe', topic))
    }

    this.socket.onmessage = (event) => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }
      this.listeners.get(message.topic)?.forEach((handler) => handler(message))
    }

    this.socket.onclose = () => {
      this.setStatus('closed')
      if (this.listeners.size > 0) this.scheduleReconnect()
    }

    this.socket.onerror = () => this.socket?.close()
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return
    // Back off up to 15s so a server restart does not turn into a request storm.
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15_000)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  send(action, topic) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, topic }))
    }
  }

  subscribe(topic, handler) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set())
      this.send('subscribe', topic)
    }
    this.listeners.get(topic).add(handler)
    this.connect()

    return () => {
      const handlers = this.listeners.get(topic)
      if (!handlers) return
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(topic)
        this.send('unsubscribe', topic)
      }
    }
  }
}

const client = new RealtimeClient()

/**
 * Subscribes to market topics for as long as the component is mounted.
 * `topics` may be a single topic or an array; pass a stable array (or a
 * `useMemo`ed one) to avoid resubscribing on every render.
 */
export function useRealtime(topics, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const list = Array.isArray(topics) ? topics : [topics]
  const topicKey = list.filter(Boolean).join('|')

  useEffect(() => {
    const active = topicKey ? topicKey.split('|') : []
    if (active.length === 0) return undefined

    const unsubscribes = active.map((topic) =>
      client.subscribe(topic, (message) => handlerRef.current?.(message)),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [topicKey])
}

/** Connection state, for the "live" indicator in the header. */
export function useRealtimeStatus() {
  const [status, setStatus] = useState(client.status)
  useEffect(() => client.onStatus(setStatus), [])
  return status
}

export const realtimeTopics = {
  market: 'market',
  subFund: (id) => `subfund:${id}`,
  basket: (id) => `basket:${id}`,
}
