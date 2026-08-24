import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/with-auth'
import { decryptPassword, encryptPassword } from '@/lib/encryption'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const { title, url, username, password, email, phone, notes, category, isFavorite } = body

    const entry = await db.passwordEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(url !== undefined && { url: url?.trim() || null }),
        ...(username !== undefined && { username: username?.trim() || null }),
        ...(password !== undefined && { password: encryptPassword(password.trim()) }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(isFavorite !== undefined && { isFavorite }),
      },
    })

    let readablePassword = entry.password
    try {
      readablePassword = decryptPassword(entry.password)
    } catch (error) {
      console.error(`Error decrypting password entry ${entry.id}:`, error)
    }

    return NextResponse.json({ ...entry, password: readablePassword })
  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    await db.passwordEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting password:', error)
    return NextResponse.json({ error: 'Failed to delete password' }, { status: 500 })
  }
}
