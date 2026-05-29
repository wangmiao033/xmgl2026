import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { id: projectId } = await params
    const body = await request.json()
    const { title, description, priority, columnId, dueDate, assigneeIds } = body

    if (!title) {
      return NextResponse.json({ error: '任务标题不能为空' }, { status: 400 })
    }

    // Determine status based on column
    let status = 'todo'
    if (columnId) {
      const column = await db.taskColumn.findUnique({
        where: { id: columnId },
      })
      if (column) {
        if (column.title === '进行中') status = 'in_progress'
        else if (column.title === '审核中') status = 'review'
        else if (column.title === '已完成') status = 'done'
      }
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        status,
        priority: priority || 'medium',
        projectId,
        columnId: columnId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignees: assigneeIds && assigneeIds.length > 0
          ? {
              create: assigneeIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}
