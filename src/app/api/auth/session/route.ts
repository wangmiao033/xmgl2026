import { NextRequest, NextResponse } from 'next/server'

// In-memory token store (simple approach for internal tool)
// In production, use Redis or database sessions
const sessions = new Map<string, { userId: string; email: string; name: string; role: string; avatar: string | null; createdAt: number }>()

export interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
}

/**
 * Validate a session token and return session data, or null if invalid.
 */
export function validateToken(token: string): SessionData | null {
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
  sessions.set(token, { ...data, createdAt: Date.now() })
}

/**
 * Remove a session (logout).
 */
export function removeSession(token: string) {
  sessions.delete(token)
}

// GET /api/auth/session - Check current session
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const session = validateToken(token)
  if (!session) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set('session_token', '', { maxAge: 0, path: '/' })
    return response
  }

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
