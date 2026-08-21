import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/with-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if ('error' in auth) return auth.error

  const encodedStamp = process.env.DEFAULT_COMPANY_SEAL_BASE64?.trim()
  if (!encodedStamp) {
    return NextResponse.json({ error: '项目默认章尚未配置' }, { status: 503 })
  }

  const stamp = Buffer.from(encodedStamp, 'base64')
  if (stamp.length < pngSignature.length || !stamp.subarray(0, pngSignature.length).equals(pngSignature)) {
    return NextResponse.json({ error: '项目默认章配置无效' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(stamp), {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'Content-Type': 'image/png',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
