import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { authenticate } from '@/lib/with-auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate via session instead of trusting client-provided userId
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword?.trim() || !newPassword?.trim()) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (newPassword.trim().length < 8) {
      return NextResponse.json({ error: '新密码至少需要8个字符，需包含字母和数字' }, { status: 400 })
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: '密码需包含至少一个字母和一个数字' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: auth.session.userId },
      select: { id: true, password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // Verify old password
    const isValid = await verifyPassword(oldPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: '原密码错误' }, { status: 401 })
    }

    // Hash and update new password
    const hashed = await hashPassword(newPassword.trim())
    await db.user.update({
      where: { id: auth.session.userId },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
}
