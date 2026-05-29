import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const { title, description, priority, status, columnId, dueDate, assigneeIds } = body

    // Update task basic fields
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (columnId !== undefined) updateData.columnId = columnId || null
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    let task
    // Handle assignee updates atomically with transaction (fix race condition)
    if (assigneeIds !== undefined) {
      if (assigneeIds && assigneeIds.length > 0) {
        updateData.assignees = {
          create: assigneeIds.map((userId: string) => ({
            userId,
          })),
        }
      }
      await db.$transaction([
        db.taskAssignee.deleteMany({
          where: { taskId: id },
        }),
        db.task.update({
          where: { id },
          data: updateData,
          include: {
            assignees: {
              include: {
                user: true,
              },
            },
          },
        }),
      ])
      // Fetch the updated task
      task = await db.task.findUnique({
        where: { id },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
        },
      })
    } else {
      task = await db.task.update({
        where: { id },
        data: updateData,
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
        },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: '任务已删除' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}
