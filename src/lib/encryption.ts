import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function keyFromSecret(secret: string): Buffer {
  // Preserve compatibility with the original implementation when a proper
  // 64+ character hex key is supplied.
  if (/^[0-9a-fA-F]{64,}$/.test(secret)) {
    return Buffer.from(secret.slice(0, 64), 'hex')
  }

  // Allow normal high-entropy secrets (AUTH_SECRET / NEXTAUTH_SECRET) by
  // deterministically deriving a 32-byte AES key.
  return crypto.createHash('sha256').update(secret, 'utf8').digest()
}

function getEncryptionKey(): Buffer {
  const explicitSecret =
    process.env.ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET

  if (explicitSecret) {
    return keyFromSecret(explicitSecret)
  }

  // Production safety fallback: this project already requires DATABASE_URL
  // for persistence. Derive a stable, app-specific key from it so password
  // saving does not fail when the dedicated encryption secret is missing.
  // A dedicated ENCRYPTION_KEY is still preferred and will take precedence.
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    return crypto
      .createHash('sha256')
      .update(`xmgl2026-password-vault:${databaseUrl}`, 'utf8')
      .digest()
  }

  throw new Error(
    'Password encryption secret is missing. Set ENCRYPTION_KEY (preferred) or AUTH_SECRET.'
  )
}

function looksEncrypted(stored: string): boolean {
  const parts = stored.split(':')
  if (parts.length !== 3) return false

  const [ivHex, tagHex, encHex] = parts
  return (
    /^[0-9a-fA-F]{32}$/.test(ivHex) &&
    /^[0-9a-fA-F]{32}$/.test(tagHex) &&
    encHex.length > 0 &&
    encHex.length % 2 === 0 &&
    /^[0-9a-fA-F]+$/.test(encHex)
  )
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
 * Decrypt AES-256-GCM ciphertext. Input format: iv:tag:ciphertext (hex).
 * Legacy plaintext values are returned unchanged.
 */
export function decryptPassword(stored: string): string {
  if (!looksEncrypted(stored)) return stored

  const [ivHex, tagHex, encHex] = stored.split(':')
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  let dec = decipher.update(encHex, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}
