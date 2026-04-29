import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tool = await db.tool.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    })
    if (!tool) return NextResponse.json({ error: '工具不存在' }, { status: 404 })
    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error fetching tool:', error)
    return NextResponse.json({ error: '获取工具失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, url, description, icon, color, categoryId } = body

    const tool = await db.tool.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(url !== undefined && { url: url.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    })

    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error updating tool:', error)
    return NextResponse.json({ error: '更新工具失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.tool.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json({ error: '删除工具失败' }, { status: 500 })
  }
}
