import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category

    if (year || month) {
      if (year && month) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
        where.date = { gte: startDate, lte: endDate }
      } else if (year) {
        const startDate = new Date(parseInt(year), 0, 1)
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
        where.date = { gte: startDate, lte: endDate }
      }
    }

    const [records, total] = await Promise.all([
      db.financeRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.financeRecord.count({ where }),
    ])

    const [totalIncome, totalExpense] = await Promise.all([
      db.financeRecord.aggregate({ where: { ...where, type: 'income' }, _sum: { amount: true } }),
      db.financeRecord.aggregate({ where: { ...where, type: 'expense' }, _sum: { amount: true } }),
    ])

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      stats: {
        totalIncome: totalIncome._sum.amount || 0,
        totalExpense: totalExpense._sum.amount || 0,
        balance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
      },
    })
  } catch (error) {
    console.error('Error fetching finance records:', error)
    return NextResponse.json({ error: '获取财务记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, category, amount, description, date, remark } = body
    if (!type || !category || !amount || !description || !date) {
      return NextResponse.json({ error: '请填写完整的财务信息' }, { status: 400 })
    }
    const record = await db.financeRecord.create({
      data: {
        type,
        category,
        amount: Math.abs(parseFloat(amount)),
        description,
        date: new Date(date),
        remark: remark || null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating finance record:', error)
    return NextResponse.json({ error: '创建财务记录失败' }, { status: 500 })
  }
}
