import crypto from 'crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1

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
