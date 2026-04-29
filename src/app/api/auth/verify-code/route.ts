import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { codeStore } from '@/app/api/auth/send-code/route'
import { signJWT } from '@/lib/jwt'
import { createSession } from '@/app/api/auth/session/route'

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: '请输入邮箱和验证码' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const inputCode = code.trim()

    // Check stored code
    const stored = codeStore.get(normalizedEmail)

    if (!stored) {
      return NextResponse.json({ error: '验证码无效或已过期，请重新获取' }, { status: 400 })
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      codeStore.delete(normalizedEmail)
      return NextResponse.json({ error: '验证码已过期，请重新获取' }, { status: 400 })
    }

    // Check attempts
    if (stored.attempts >= MAX_ATTEMPTS) {
      codeStore.delete(normalizedEmail)
      return NextResponse.json({ error: '验证次数过多，请重新获取验证码' }, { status: 400 })
    }

    // Increment attempts
    stored.attempts++

    // Verify code
    if (stored.code !== inputCode) {
      const remaining = MAX_ATTEMPTS - stored.attempts
      if (remaining <= 0) {
        codeStore.delete(normalizedEmail)
        return NextResponse.json({ error: '验证次数过多，请重新获取验证码' }, { status: 400 })
      }
      return NextResponse.json({ error: `验证码错误，还剩${remaining}次机会` }, { status: 400 })
    }

    // Code is valid - clear it
    codeStore.delete(normalizedEmail)

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    })

    if (!user) {
      // Auto-create user if not exists (since they verified email)
      user = await db.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          role: 'member',
        },
        select: { id: true, email: true, name: true, role: true, avatar: true },
      })
    }

    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    }

    // Sign JWT token (used for cookie + middleware auth)
    const jwtToken = await signJWT(sessionData)

    // Also create a DB session record for online user tracking
    await createSession(jwtToken, sessionData).catch(() => {})

    const response = NextResponse.json({
      user: sessionData,
    })

    response.cookies.set('session_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: '验证登录失败' }, { status: 500 })
  }
}
