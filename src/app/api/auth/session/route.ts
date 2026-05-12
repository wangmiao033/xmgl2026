import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseAuthCookieValue } from '@/lib/auth'

// In-memory token store (simple approach for internal tool)
// In production, use Redis or database sessions
const sessions = new Map<string, { userId: string; email: string; name: string; role: string; avatar: string | null; createdAt: number; lastActivity: number }>()

export interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
}

export interface OnlineUserInfo {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
  lastActivity: number
}

const ONLINE_THRESHOLD = 2 * 60 * 1000 // 2 minutes

/**
 * Validate a session token and return session data, or null if invalid.
 */
export async function validateToken(token: string): Promise<SessionData | null> {
  const cookiePayload = parseAuthCookieValue(token)
  if (cookiePayload) {
    const user = await db.user.findUnique({
      where: { id: cookiePayload.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    })

    if (!user) return null

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    }
  }

  const session = sessions.get(token)
  if (!session) return null
  // Check if session is expired (7 days)
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    sessions.delete(token)
    return null
  }
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    avatar: session.avatar,
  }
}

/**
 * Register a new session.
 */
export function createSession(token: string, data: { userId: string; email: string; name: string; role: string; avatar: string | null }) {
  const now = Date.now()
  sessions.set(token, { ...data, createdAt: now, lastActivity: now })
}

/**
 * Update session activity timestamp (heartbeat).
 */
export function updateSessionActivity(token: string) {
  const session = sessions.get(token)
  if (session) {
    session.lastActivity = Date.now()
  }
}

/**
 * Remove a session (logout).
 */
export function removeSession(token: string) {
  sessions.delete(token)
}

/**
 * Get all online users (active within last 2 minutes).
 * Returns the most recent session per userId.
 */
export function getAllOnlineUsers(): OnlineUserInfo[] {
  const now = Date.now()
  const userMap = new Map<string, OnlineUserInfo>()

  sessions.forEach((session) => {
    if (now - session.lastActivity <= ONLINE_THRESHOLD) {
      const existing = userMap.get(session.userId)
      if (!existing || session.lastActivity > existing.lastActivity) {
        userMap.set(session.userId, {
          userId: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
          avatar: session.avatar,
          lastActivity: session.lastActivity,
        })
      }
    }
  })

  return Array.from(userMap.values())
}

// GET /api/auth/session - Check current session
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const session = await validateToken(token)
  if (!session) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set('session_token', '', { maxAge: 0, path: '/' })
    return response
  }

  createSession(token, session)
  updateSessionActivity(token)

  return NextResponse.json({ authenticated: true, user: session })
}

// POST /api/auth/session - Create session after login
export async function POST(request: NextRequest) {
  const { token, user } = await request.json()

  if (!token || !user) {
    return NextResponse.json({ error: 'Invalid session data' }, { status: 400 })
  }

  createSession(token, user)
  return NextResponse.json({ success: true })
}

// DELETE /api/auth/session - Logout
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  if (token) removeSession(token)

  const response = NextResponse.json({ success: true })
  response.cookies.set('session_token', '', { maxAge: 0, path: '/' })
  return response
}
