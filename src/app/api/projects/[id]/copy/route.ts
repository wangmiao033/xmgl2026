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
    const body = await request.json().catch(() => ({}))
    const source = await db.project.findUnique({
      where: { id },
      include: {
        channels: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!source) return NextResponse.json({ error: '原项目不存在' }, { status: 404 })

    const name = String(body.name || `${source.name} - 新项目`).trim()
    if (!name) return NextResponse.json({ error: '新项目名称不能为空' }, { status: 400 })

    const copied = await db.project.create({
      data: {
        name,
        description: null,
        status: 'active',
        priority: source.priority,
        category: 'game',
        startDate: new Date(),
        endDate: null,
        progress: 0,
        gameType: source.gameType,
        partnerCompany: null,
        contactName: null,
        contactPhone: null,
        cooperationMode: source.cooperationMode,
        launchDate: null,
        isbn: null,
        copyrightNo: null,
        appRecordNo: null,
        antiAddictionNo: null,
        basePackageName: null,
        notes: null,
        docUrl: null,
        docName: null,
        columns: {
          create: [
            { title: '待办', order: 0 },
            { title: '进行中', order: 1 },
            { title: '审核中', order: 2 },
            { title: '已完成', order: 3 },
          ],
        },
        channels: source.channels.length
          ? {
              create: source.channels.map((channel, index) => ({
                channelName: channel.channelName,
                channelType: channel.channelType,
                owner: channel.owner,
                packageName: null,
                appId: null,
                paramsStatus: 'pending',
                packageStatus: 'pending',
                testingStatus: 'pending',
                reviewStatus: 'pending',
                launchStatus: 'pending',
                notes: null,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        channels: true,
      },
    })

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('Error copying project:', error)
    return NextResponse.json({ error: '复制项目失败' }, { status: 500 })
  }
}
