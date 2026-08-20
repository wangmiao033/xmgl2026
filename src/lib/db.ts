import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const bundledDatabasePath = path.join(process.cwd(), 'db/custom.db')
const bundledDatabaseUrl = `file:${bundledDatabasePath}`
const configuredDatabaseUrl = process.env.DATABASE_URL

if (!configuredDatabaseUrl || configuredDatabaseUrl.startsWith('file:') || configuredDatabaseUrl.includes('/home/z/')) {
  if (process.env.NODE_ENV === 'production') {
    const deploymentId = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'local')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 48)
    const writableDatabasePath = path.join('/tmp', `xmgl2026-custom-${deploymentId}.db`)

    try {
      if (!fs.existsSync(writableDatabasePath)) {
        fs.copyFileSync(bundledDatabasePath, writableDatabasePath)
      }

      process.env.DATABASE_URL = `file:${writableDatabasePath}`
    } catch (error) {
      console.error('[DB] Failed to prepare writable SQLite database, falling back to bundled database:', error)
      process.env.DATABASE_URL = bundledDatabaseUrl
    }
  } else {
    process.env.DATABASE_URL = bundledDatabaseUrl
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
