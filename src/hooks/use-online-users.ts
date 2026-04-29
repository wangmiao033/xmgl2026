'use client'

import { useState, useEffect, useRef } from 'react'

interface OnlineUser {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
  lastActivity: number
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set up polling with interval — setState called in async callback, not synchronously in effect body
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/users/online')
        if (res.ok) {
          const data = await res.json()
          setOnlineUsers(data)
          setOnlineCount(data.length)
        }
      } catch {
        // ignore
      }
    }

    // Initial fetch via the interval callback (async, so not synchronous setState)
    intervalRef.current = setInterval(fetchOnline, 30000)
    fetchOnline()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { onlineUsers, onlineCount }
}
