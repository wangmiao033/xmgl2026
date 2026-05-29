import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAllOnlineUsers } from '@/app/api/auth/session/route'
import { authenticate } from '@/lib/with-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const users = await db.user.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
        projects: {
          select: {
            projectId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Batch query: count completed tasks per user in one query (fix N+1)
    const completedCounts = await db.taskAssignee.groupBy({
      by: ['userId'],
      where: { task: { status: 'done' } },
      _count: { id: true },
    })
    const countMap = new Map(completedCounts.map((c) => [c.userId, c._count.id]))

    const usersWithStats = users.map((user) => ({
      ...user,
      completedTasks: countMap.get(user.id) || 0,
      projectCount: user.projects?.length || 0,
    }))

    // Get online users to enrich response
    const onlineUsers = getAllOnlineUsers()
    const onlineUserIds = new Set(onlineUsers.map((u) => u.userId))

    // Build a map of userId -> lastActivity for online status
    const onlineActivityMap = new Map<string, number>()
    onlineUsers.forEach((u) => {
      onlineActivityMap.set(u.userId, u.lastActivity)
    })

    // Remove projects array and add isOnline + lastActivity
    const result = usersWithStats.map(({ projects, ...rest }) => ({
      ...rest,
      isOnline: onlineUserIds.has(rest.id),
      lastActivity: onlineActivityMap.get(rest.id) || null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    // Only admins can create users
    if (auth.session.role !== 'admin') {
      return NextResponse.json({ error: '权限不足，仅管理员可创建用户' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role } = body
    if (!name || !email) {
      return NextResponse.json({ error: '姓名和邮箱不能为空' }, { status: 400 })
    }
    // Only admins can set admin role; default to member for safety
    const userRole = auth.session.role === 'admin' ? (role || 'member') : 'member'
    const user = await db.user.create({
      data: { name, email, role: userRole },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    if (auth.session.role !== 'admin') {
      return NextResponse.json({ error: '权限不足，仅管理员可编辑成员' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, email, role } = body
    if (!id || !name || !email) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: '成员不存在' }, { status: 404 })
    }

    const user = await db.user.update({
      where: { id },
      data: { name, email, role: role || existingUser.role },
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: '更新成员失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    if (auth.session.role !== 'admin') {
      return NextResponse.json({ error: '权限不足，仅管理员可删除成员' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少成员ID' }, { status: 400 })
    }

    if (id === auth.session.userId) {
      return NextResponse.json({ error: '不能删除自己的账号' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: '成员不存在' }, { status: 404 })
    }

    // Remove task assignments for this user
    await db.taskAssignee.deleteMany({ where: { userId: id } })
    // Remove project memberships for this user
    await db.projectMember.deleteMany({ where: { userId: id } })
    // Delete the user
    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: '删除成员失败' }, { status: 500 })
  }
}
