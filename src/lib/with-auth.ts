import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/app/api/auth/session/route'

export interface AuthSession {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
}

/**
 * Validate session from request cookies. Returns session data or an error response.
 * Use in every API route that requires authentication.
 */
export async function authenticate(request: NextRequest): Promise<
  | { session: AuthSession }
  | { error: NextResponse }
> {
  const token = request.cookies.get('session_token')?.value
  if (!token) {
    return {
      error: NextResponse.json({ error: '未登录，请先登录' }, { status: 401 }),
    }
  }

  const session = await validateToken(token)
  if (!session) {
    return {
      error: NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 }),
    }
  }

  return { session }
}
