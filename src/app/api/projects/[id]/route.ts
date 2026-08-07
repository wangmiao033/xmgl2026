import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const { id } = await params
    const project = await db.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: { joinedAt: 'asc' },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              include: {
                assignees: {
                  include: {
                    user: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        channels: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            channels: true,
            files: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: '获取项目详情失败' }, { status: 500 })
  }
}

export async function PUT(
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
      name,
      description,
      status,
      priority,
      category,
      docUrl,
      docName,
      startDate,
      endDate,
      progress,
      gameType,
      partnerCompany,
      contactName,
      contactPhone,
      cooperationMode,
      launchDate,
      isbn,
      copyrightNo,
      appRecordNo,
      antiAddictionNo,
      basePackageName,
      notes,
    } = body

    const project = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name?.trim() || name }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(docUrl !== undefined && { docUrl: docUrl?.trim() || null }),
        ...(docName !== undefined && { docName: docName?.trim() || null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(progress !== undefined && { progress }),
        ...(gameType !== undefined && { gameType: gameType?.trim() || null }),
        ...(partnerCompany !== undefined && { partnerCompany: partnerCompany?.trim() || null }),
        ...(contactName !== undefined && { contactName: contactName?.trim() || null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone?.trim() || null }),
        ...(cooperationMode !== undefined && { cooperationMode: cooperationMode?.trim() || null }),
        ...(launchDate !== undefined && { launchDate: launchDate ? new Date(launchDate) : null }),
        ...(isbn !== undefined && { isbn: isbn?.trim() || null }),
        ...(copyrightNo !== undefined && { copyrightNo: copyrightNo?.trim() || null }),
        ...(appRecordNo !== undefined && { appRecordNo: appRecordNo?.trim() || null }),
        ...(antiAddictionNo !== undefined && { antiAddictionNo: antiAddictionNo?.trim() || null }),
        ...(basePackageName !== undefined && { basePackageName: basePackageName?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 })
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
    await db.project.delete({
      where: { id },
    })

    return NextResponse.json({ message: '项目已删除' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 })
  }
}
