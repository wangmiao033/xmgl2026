import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

const editableFields = [
  'channelName',
  'channelType',
  'packageName',
  'appId',
  'owner',
  'paramsStatus',
  'packageStatus',
  'testingStatus',
  'reviewStatus',
  'launchStatus',
  'notes',
  'sortOrder',
] as const

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const { id, channelId } = await params
    const existing = await db.projectChannel.findFirst({
      where: { id: channelId, projectId: id },
    })
    if (!existing) return NextResponse.json({ error: '渠道记录不存在' }, { status: 404 })

    const body = await request.json()
    const data: Record<string, string | number | null> = {}
    for (const field of editableFields) {
      if (body[field] === undefined) continue
      if (field === 'sortOrder') {
        data[field] = Number(body[field]) || 0
      } else {
        const value = body[field]
        data[field] = value === null ? null : String(value).trim() || null
      }
    }

    const updated = await db.projectChannel.update({
      where: { id: channelId },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project channel:', error)
    return NextResponse.json({ error: '更新渠道失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const { id, channelId } = await params
    const existing = await db.projectChannel.findFirst({
      where: { id: channelId, projectId: id },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: '渠道记录不存在' }, { status: 404 })

    await db.projectChannel.delete({ where: { id: channelId } })
    return NextResponse.json({ message: '渠道已删除' })
  } catch (error) {
    console.error('Error deleting project channel:', error)
    return NextResponse.json({ error: '删除渠道失败' }, { status: 500 })
  }
}
