import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { userId, oldPassword, newPassword } = await request.json()

    if (!userId || !oldPassword?.trim() || !newPassword?.trim()) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (newPassword.trim().length < 4) {
      return NextResponse.json({ error: '新密码至少需要4个字符' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
}
