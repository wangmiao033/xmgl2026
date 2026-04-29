import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/jwt'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/send-code',
  '/api/auth/verify-code',
  '/api/auth/session',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public auth routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check session token (JWT)
  const token = request.cookies.get('session_token')?.value
  if (!token) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  // Verify JWT (no database access needed - works in Edge Runtime)
  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.json({ error: '登录已过期' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
