import crypto from 'crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const AUTH_COOKIE_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'xmgl2026-local-auth-secret'

interface AuthCookiePayload {
  userId: string
  exp: number
}

/**
 * Hash a password using scrypt with a random salt.
 * Returns the hex-encoded string: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
  })
  return salt.toString('hex') + ':' + derivedKey.toString('hex')
}

/**
 * Verify a password against a stored hash (salt:hash format).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length < 2) return false
  const saltHex = parts[0]
  const hashHex = parts.slice(1).join(':') // handle edge case
  if (!saltHex || !hashHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
  })
  return timingSafeEqual(derivedKey.toString('hex'), hashHex)
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  try {
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Generate a simple random token for session identification.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(value: string): string {
  return crypto.createHmac('sha256', AUTH_COOKIE_SECRET).update(value).digest('base64url')
}

/**
 * Create a signed auth cookie value that can be verified without server memory.
 */
export function createAuthCookieValue(userId: string, maxAgeSeconds: number): string {
  const payload: AuthCookiePayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

/**
 * Parse and verify the signed auth cookie.
 */
export function parseAuthCookieValue(cookieValue: string): AuthCookiePayload | null {
  const [encodedPayload, signature] = cookieValue.split('.')
  if (!encodedPayload || !signature || !timingSafeTextEqual(signature, sign(encodedPayload))) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthCookiePayload
    if (!payload.userId || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
