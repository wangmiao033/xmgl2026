import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    // Batch query: groupBy status and priority in parallel (fix 12+ sequential queries)
    const [taskByStatus, taskByPriority, projectByStatus, totalUsers] = await Promise.all([
      db.task.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.task.groupBy({
        by: ['priority'],
        _count: true,
      }),
      db.project.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.user.count(),
    ])

    // Build count maps
    const statusMap = new Map(taskByStatus.map((t) => [t.status, t._count]))
    const priorityMap = new Map(taskByPriority.map((t) => [t.priority, t._count]))
    const projectStatusMap = new Map(projectByStatus.map((p) => [p.status, p._count]))

    const totalTasks = taskByStatus.reduce((sum, t) => sum + t._count, 0)
    const totalProjects = projectByStatus.reduce((sum, p) => sum + p._count, 0)

    const completedTasks = statusMap.get('done') || 0
    const inProgressTasks = statusMap.get('in_progress') || 0
    const todoTasks = statusMap.get('todo') || 0
    const reviewTasks = statusMap.get('review') || 0
    const activeProjects = projectStatusMap.get('active') || 0
    const completedProjects = projectStatusMap.get('completed') || 0

    const tasksByPriority = {
      urgent: priorityMap.get('urgent') || 0,
      high: priorityMap.get('high') || 0,
      medium: priorityMap.get('medium') || 0,
      low: priorityMap.get('low') || 0,
    }

    // Project management overview
    const recentProjects = await db.project.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
        members: {
          include: {
            user: true,
          },
          take: 3,
        },
      },
    })

    // Recent tasks
    const recentTasks = await db.task.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    })

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return NextResponse.json({
      totalProjects,
      totalUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      activeProjects,
      completedProjects,
      completionRate,
      tasksByPriority,
      recentProjects,
      recentTasks,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
