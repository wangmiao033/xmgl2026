import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const record = await db.financeRecord.findUnique({ where: { id } })
    if (!record) return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching finance record:', error)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, category, amount, description, date, remark } = body
    const record = await db.financeRecord.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount: Math.abs(parseFloat(amount)) }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(remark !== undefined && { remark: remark || null }),
      },
    })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating finance record:', error)
    return NextResponse.json({ error: '更新记录失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.financeRecord.delete({ where: { id } })
    return NextResponse.json({ message: '记录已删除' })
  } catch (error) {
    console.error('Error deleting finance record:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
