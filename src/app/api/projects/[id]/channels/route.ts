import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const { id } = await params
    const body = await request.json()
    const {
      channelName,
      channelNames,
      channelType,
      packageName,
      appId,
      owner,
      notes,
    } = body

    const rawNames = Array.isArray(channelNames) ? channelNames : [channelName]
    const names = Array.from(
      new Set(rawNames.map((name) => String(name || '').trim()).filter(Boolean))
    )

    if (names.length === 0) {
      return NextResponse.json({ error: '渠道名称不能为空' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })

    const existing = await db.projectChannel.findMany({
      where: { projectId: id, channelName: { in: names } },
      select: { channelName: true },
    })
    const existingNames = new Set(existing.map((item) => item.channelName))
    const toCreate = names.filter((name) => !existingNames.has(name))

    if (toCreate.length === 0) {
      return NextResponse.json({ error: '所选渠道已经存在于项目中' }, { status: 409 })
    }

    const baseOrder = await db.projectChannel.count({ where: { projectId: id } })
    const created = await db.$transaction(
      toCreate.map((name, index) =>
        db.projectChannel.create({
          data: {
            projectId: id,
            channelName: name,
            channelType: channelType?.trim() || null,
            packageName: packageName?.trim() || null,
            appId: appId?.trim() || null,
            owner: owner?.trim() || null,
            notes: notes?.trim() || null,
            sortOrder: baseOrder + index,
          },
        })
      )
    )

    return NextResponse.json(
      Array.isArray(channelNames) ? created : created[0],
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project channel:', error)
    return NextResponse.json({ error: '添加渠道失败' }, { status: 500 })
  }
}
