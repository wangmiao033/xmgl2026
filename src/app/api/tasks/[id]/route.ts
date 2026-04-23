import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Handle assignee updates
    if (assigneeIds !== undefined) {
      // First delete existing assignees
      await db.taskAssignee.deleteMany({
        where: { taskId: id },
      })

      // Create new assignees if any
      if (assigneeIds && assigneeIds.length > 0) {
        updateData.assignees = {
          create: assigneeIds.map((userId: string) => ({
            userId,
          })),
        }
      }
    }

    const task = await db.task.update({
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
