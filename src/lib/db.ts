import { PrismaClient } from '@prisma/client'
import path from 'path'

const bundledDatabaseUrl = `file:${path.join(process.cwd(), 'db/custom.db')}`
const configuredDatabaseUrl = process.env.DATABASE_URL

if (!configuredDatabaseUrl || configuredDatabaseUrl.startsWith('file:') || configuredDatabaseUrl.includes('/home/z/')) {
  process.env.DATABASE_URL = bundledDatabaseUrl
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
