import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await db.toolCategory.findMany({
      include: {
        tools: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching tool categories:', error)
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, icon, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 })
    }

    // Get max order
    const maxOrder = await db.toolCategory.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const category = await db.toolCategory.create({
      data: {
        name: name.trim(),
        icon: icon || 'Link',
        color: color || 'slate',
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating tool category:', error)
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}
