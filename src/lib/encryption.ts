import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || ''
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY environment variable is required (32+ hex chars)')
  }
  return Buffer.from(key.slice(0, 64), 'hex').slice(0, 32)
}

/**
 * Encrypt plaintext using AES-256-GCM. Returns: iv:tag:ciphertext (hex)
 */
export function encryptPassword(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  let enc = cipher.update(plaintext, 'utf8', 'hex')
  enc += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`
}

/**
 * Decrypt AES-256-GCM ciphertext. Input format: iv:tag:ciphertext (hex)
 */
export function decryptPassword(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 3) return stored // Fallback: return as-is if not encrypted

  const [ivHex, tagHex, encHex] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  let dec = decipher.update(encHex, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}
