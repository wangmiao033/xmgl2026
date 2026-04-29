import { NextResponse } from 'next/server'
import { getAllOnlineUsers } from '@/app/api/auth/session/route'

export async function GET() {
  const onlineUsers = getAllOnlineUsers()
  return NextResponse.json(onlineUsers)
}
