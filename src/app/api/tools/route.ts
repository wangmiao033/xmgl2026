import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const tools = await db.tool.findMany({
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tools)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json({ error: '获取工具失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, url, description, icon, color, categoryId } = body

    if (!name?.trim() || !url?.trim() || !categoryId) {
      return NextResponse.json({ error: '名称、链接和分类不能为空' }, { status: 400 })
    }

    // Get max order in category
    const maxOrder = await db.tool.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const tool = await db.tool.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        icon: icon || 'Globe',
        color: color || 'slate',
        order: (maxOrder?.order ?? -1) + 1,
        categoryId,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('Error creating tool:', error)
    return NextResponse.json({ error: '创建工具失败' }, { status: 500 })
  }
}
