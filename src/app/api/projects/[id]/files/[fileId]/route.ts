import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { ensureGameProjectSchema } from '@/lib/ensure-game-project-schema'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error
    await ensureGameProjectSchema()

    const { id, fileId } = await params
    const existing = await db.projectFile.findFirst({
      where: { id: fileId, projectId: id },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: '资料不存在' }, { status: 404 })

    await db.projectFile.delete({ where: { id: fileId } })
    return NextResponse.json({ message: '资料已删除' })
  } catch (error) {
    console.error('Error deleting project file:', error)
    return NextResponse.json({ error: '删除资料失败' }, { status: 500 })
  }
}
