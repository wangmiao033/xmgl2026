import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuthCookieValue, verifyPassword } from '@/lib/auth'
import { createSession } from '@/app/api/auth/session/route'

const ONE_DAY_SECONDS = 60 * 60 * 24
const SEVEN_DAYS_SECONDS = ONE_DAY_SECONDS * 7

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, role: true, avatar: true, password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    const maxAge = rememberMe === false ? ONE_DAY_SECONDS : SEVEN_DAYS_SECONDS

    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    }

    const token = createAuthCookieValue(user.id, maxAge)
    createSession(token, sessionData)

    const response = NextResponse.json({
      user: sessionData,
      token,
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
