import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    const usersWithStats = users.map((user) => ({
      ...user,
      completedTasks: 0, // Will be calculated
      projectCount: user.projects?.length || 0,
    }))

    // Get completed task counts per user
    const completedTaskCounts = await db.task.groupBy({
      by: ['status'],
      _count: true,
    })

    // For each user, count completed tasks
    for (let i = 0; i < usersWithStats.length; i++) {
      const completedCount = await db.taskAssignee.count({
        where: {
          userId: usersWithStats[i].id,
          task: {
            status: 'done',
          },
        },
      })
      usersWithStats[i].completedTasks = completedCount
    }

    // Remove projects array to keep response clean
    const result = usersWithStats.map(({ projects, ...rest }) => rest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role } = body
    if (!name || !email) {
      return NextResponse.json({ error: '姓名和邮箱不能为空' }, { status: 400 })
    }
    const user = await db.user.create({
      data: { name, email, role: role || 'member' },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}
