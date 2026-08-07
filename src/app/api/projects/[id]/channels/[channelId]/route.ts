import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

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
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: '渠道记录不存在' }, { status: 404 })

    const body = await request.json()
    const updated = await db.projectChannel.update({
      where: { id: channelId },
      data: {
        ...(body.channelName !== undefined && { channelName: String(body.channelName).trim() }),
        ...(body.channelType !== undefined && { channelType: String(body.channelType || '').trim() || null }),
        ...(body.packageName !== undefined && { packageName: String(body.packageName || '').trim() || null }),
        ...(body.appId !== undefined && { appId: String(body.appId || '').trim() || null }),
        ...(body.owner !== undefined && { owner: String(body.owner || '').trim() || null }),
        ...(body.paramsStatus !== undefined && { paramsStatus: String(body.paramsStatus) }),
        ...(body.packageStatus !== undefined && { packageStatus: String(body.packageStatus) }),
        ...(body.testingStatus !== undefined && { testingStatus: String(body.testingStatus) }),
        ...(body.reviewStatus !== undefined && { reviewStatus: String(body.reviewStatus) }),
        ...(body.launchStatus !== undefined && { launchStatus: String(body.launchStatus) }),
        ...(body.notes !== undefined && { notes: String(body.notes || '').trim() || null }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
      },
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
