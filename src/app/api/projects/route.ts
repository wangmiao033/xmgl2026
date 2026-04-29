import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
        columns: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const projectsWithStats = projects.map((project) => ({
      ...project,
      taskCount: project._count.tasks,
      memberCount: project._count.members,
    }))

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, status, priority, category, docUrl, docName, startDate, endDate } = body

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        description: description || null,
        status: status || 'active',
        priority: priority || 'medium',
        category: category || 'other',
        docUrl: docUrl || null,
        docName: docName || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        columns: {
          create: [
            { title: '待办', order: 0 },
            { title: '进行中', order: 1 },
            { title: '审核中', order: 2 },
            { title: '已完成', order: 3 },
          ],
        },
      },
      include: {
        columns: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
  }
}
