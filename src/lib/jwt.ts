/**
 * Lightweight JWT implementation using Web Crypto API.
 * Works in both Edge Runtime (middleware) and Node.js (route handlers).
 */

// Use a static secret derived from env or a default for development.
// In production, set JWT_SECRET env variable.
const JWT_SECRET = process.env.JWT_SECRET || 'pms-session-secret-2024-hnchpower'

// SHA-256 HMAC key (cached after first use)
let hmacKey: CryptoKey | null = null

async function getHmacKey(): Promise<CryptoKey> {
  if (hmacKey) return hmacKey
  const encoder = new TextEncoder()
  hmacKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  return hmacKey
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: string
  avatar?: string | null
  iat: number
  exp: number
}

/**
 * Sign a JWT with the given payload.
 * Adds iat (issued at) and exp (expiration) automatically.
 * @param payload - User data to include in the token
 * @param maxAgeMs - Token validity duration in milliseconds (default: 24 hours)
 */
export async function signJWT(payload: Omit<JwtPayload, 'iat' | 'exp'>, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<string> {
  const key = await getHmacKey()
  const encoder = new TextEncoder()

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Date.now()
  const jwtPayload = { ...payload, iat: Math.floor(now / 1000), exp: Math.floor((now + maxAgeMs) / 1000) }

  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)).buffer)
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(jwtPayload)).buffer)
  const signingInput = `${headerB64}.${payloadB64}`

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signingInput)
  )

  const signatureB64 = base64UrlEncode(signature)

  return `${signingInput}.${signatureB64}`
}

/**
 * Verify a JWT and return its payload, or null if invalid/expired.
 */
export async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`
    const encoder = new TextEncoder()

    // Verify signature
    const key = await getHmacKey()
    const signature = base64UrlDecode(signatureB64)
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(signingInput)
    )
    if (!isValid) return null

    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)))

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) return null

    return payload as JwtPayload
  } catch {
    return null
  }
}
