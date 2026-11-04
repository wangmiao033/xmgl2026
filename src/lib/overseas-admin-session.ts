import crypto from 'crypto'

export const OVERSEAS_ADMIN_COOKIE = 'overseas_admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24

function signature(payload: string): string | null {
  const secret = process.env.OVERSEAS_SESSION_SECRET
  if (!secret || secret.length < 48) return null
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

// Mint ONLY after a successful password check in /api/auth/login.
// Do not mint from /api/auth/session: the legacy login cookie may use an
// insecure historical fallback and is insufficient on its own for this module.
export function mintOverseasAdminSession(userId: string): string | null {
  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  })).toString('base64url')
  const sig = signature(payload)
  return sig ? payload + '.' + sig : null
}

export function verifyOverseasAdminSession(token: string | undefined, userId: string): boolean {
  if (!token || !userId) return false
  const [payload, provided] = token.split('.')
  if (!payload || !provided) return false
  const expected = signature(payload)
  if (!expected) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; exp?: number }
    return claims.userId === userId && typeof claims.exp === 'number' && claims.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}
