import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const projects = await db.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: true,
              },
            },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
        },
        channels: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
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
      orderBy: { createdAt: 'desc' },
    })

    const projectsWithStats = projects.map((project) => ({
      ...project,
      taskCount: project._count.tasks,
      memberCount: project._count.members,
      channelCount: project._count.channels,
      fileCount: project._count.files,
    }))

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

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

    if (!name?.trim()) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'active',
        priority: priority || 'medium',
        category: category || 'game',
        docUrl: docUrl?.trim() || null,
        docName: docName?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        gameType: gameType?.trim() || null,
        partnerCompany: partnerCompany?.trim() || null,
        contactName: contactName?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        cooperationMode: cooperationMode?.trim() || null,
        launchDate: launchDate ? new Date(launchDate) : null,
        isbn: isbn?.trim() || null,
        copyrightNo: copyrightNo?.trim() || null,
        appRecordNo: appRecordNo?.trim() || null,
        antiAddictionNo: antiAddictionNo?.trim() || null,
        basePackageName: basePackageName?.trim() || null,
        notes: notes?.trim() || null,
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
        channels: true,
        files: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
  }
}
