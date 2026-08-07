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
    const { name, url, category, notes } = body

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: '资料名称和链接不能为空' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })

    const file = await db.projectFile.create({
      data: {
        projectId: id,
        name: name.trim(),
        url: url.trim(),
        category: category || 'other',
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error('Error creating project file:', error)
    return NextResponse.json({ error: '添加资料失败' }, { status: 500 })
  }
}
