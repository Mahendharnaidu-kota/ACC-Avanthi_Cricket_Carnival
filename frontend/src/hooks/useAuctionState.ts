import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { auctionApi, getAuctionWebSocketUrl } from '../api/client'
import type { AuctionPublicState } from '../api/types'

export type AuctionConnectionStatus = 'live' | 'reconnecting'

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    return error.message || 'Auction state could not be loaded.'
  }
  return error instanceof Error ? error.message : 'Auction state could not be loaded.'
}

export function useAuctionState() {
  const [state, setState] = useState<AuctionPublicState | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<AuctionConnectionStatus>('reconnecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clockTick, setClockTick] = useState(0)
  const receivedAtRef = useRef(0)

  useEffect(() => {
    let active = true
    let socket: WebSocket | null = null
    let pollTimer: number | null = null
    let reconnectTimer: number | null = null
    let reconnectDelay = 1000
    let polling = false

    const applyState = (nextState: AuctionPublicState) => {
      if (!active) return
      receivedAtRef.current = performance.now()
      setState(nextState)
      setLoading(false)
      setError('')
    }

    const pollState = async () => {
      if (!active || polling || socket?.readyState === WebSocket.OPEN) return
      polling = true
      try {
        applyState(await auctionApi.state())
      } catch (reason: unknown) {
        if (active) {
          setLoading(false)
          setError(errorMessage(reason))
        }
      } finally {
        polling = false
      }
    }

    const startPolling = () => {
      if (pollTimer !== null || !active) return
      void pollState()
      pollTimer = window.setInterval(() => { void pollState() }, 1000)
    }

    const stopPolling = () => {
      if (pollTimer !== null) window.clearInterval(pollTimer)
      pollTimer = null
    }

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== null) return
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect()
      }, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 10000)
    }

    const connect = () => {
      if (!active) return
      setConnectionStatus('reconnecting')
      startPolling()
      try {
        socket = new WebSocket(getAuctionWebSocketUrl())
      } catch (reason: unknown) {
        setError(errorMessage(reason))
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        if (!active) return
        setConnectionStatus('live')
        reconnectDelay = 1000
        stopPolling()
      }
      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          applyState(JSON.parse(event.data) as AuctionPublicState)
        } catch {
          setError('Received an invalid auction state update.')
        }
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => {
        if (!active) return
        socket = null
        setConnectionStatus('reconnecting')
        startPolling()
        scheduleReconnect()
      }
    }

    const tickTimer = window.setInterval(() => setClockTick((tick) => tick + 1), 200)
    connect()

    return () => {
      active = false
      stopPolling()
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer)
      window.clearInterval(tickTimer)
      socket?.close()
    }
  }, [])

  let countdownSeconds = 0
  if (state?.status === 'running') {
    if (state.seconds_remaining !== null) {
      const elapsedSeconds = Math.floor((performance.now() - receivedAtRef.current) / 1000)
      countdownSeconds = Math.max(0, state.seconds_remaining - elapsedSeconds)
    } else if (state.timer_ends_at) {
      countdownSeconds = Math.max(0, Math.ceil((Date.parse(state.timer_ends_at) - Date.now()) / 1000))
    }
  }
  void clockTick

  return { state, connectionStatus, loading, error, countdownSeconds }
}
