import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { decryptPassword, encryptPassword } from '@/lib/encryption'

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

    // Keep the existing client contract: authenticated users receive usable
    // password values. Legacy plaintext rows pass through unchanged; newly
    // encrypted rows are decrypted here on the server.
    const readableEntries = entries.map((entry) => {
      try {
        return { ...entry, password: decryptPassword(entry.password) }
      } catch (error) {
        console.error(`Error decrypting password entry ${entry.id}:`, error)
        return entry
      }
    })

    return NextResponse.json(readableEntries)
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

    const plainPassword = password.trim()
    const entry = await db.passwordEntry.create({
      data: {
        title: title.trim(),
        url: url?.trim() || null,
        username: username?.trim() || null,
        password: encryptPassword(plainPassword),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        category: category || 'other',
      },
    })

    return NextResponse.json({ ...entry, password: plainPassword }, { status: 201 })
  } catch (error) {
    console.error('Error creating password:', error)
    return NextResponse.json({ error: 'Failed to create password' }, { status: 500 })
  }
}
