import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalProjects = await db.project.count()
    const totalUsers = await db.user.count()
    const totalTasks = await db.task.count()

    const completedTasks = await db.task.count({
      where: { status: 'done' },
    })

    const inProgressTasks = await db.task.count({
      where: { status: 'in_progress' },
    })

    const todoTasks = await db.task.count({
      where: { status: 'todo' },
    })

    const reviewTasks = await db.task.count({
      where: { status: 'review' },
    })

    const activeProjects = await db.project.count({
      where: { status: 'active' },
    })

    const completedProjects = await db.project.count({
      where: { status: 'completed' },
    })

    const urgentTasks = await db.task.count({
      where: { priority: 'urgent' },
    })

    const highPriorityTasks = await db.task.count({
      where: { priority: 'high' },
    })

    const mediumPriorityTasks = await db.task.count({
      where: { priority: 'medium' },
    })

    const lowPriorityTasks = await db.task.count({
      where: { priority: 'low' },
    })

    // Tasks by priority
    const tasksByPriority = {
      urgent: urgentTasks,
      high: highPriorityTasks,
      medium: mediumPriorityTasks,
      low: lowPriorityTasks,
    }

    // Recent projects (last 4)
    const recentProjects = await db.project.findMany({
      take: 4,
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
