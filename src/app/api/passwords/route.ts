import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { encryptPassword } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { url: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { notes: { contains: search } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }

    const entries = await db.passwordEntry.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching passwords:', error)
    return NextResponse.json({ error: 'Failed to fetch passwords' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { title, url, username, password, email, phone, notes, category } = body

    if (!title?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Title and password are required' }, { status: 400 })
    }

    const entry = await db.passwordEntry.create({
      data: {
        title: title.trim(),
        url: url?.trim() || null,
        username: username?.trim() || null,
        password: encryptPassword(password.trim()),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        category: category || 'other',
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating password:', error)
    return NextResponse.json({ error: 'Failed to create password' }, { status: 500 })
  }
}
