import { db } from '@/lib/db'

let initialized = false

const projectColumns: Record<string, string> = {
  gameType: 'TEXT',
  partnerCompany: 'TEXT',
  contactName: 'TEXT',
  contactPhone: 'TEXT',
  cooperationMode: 'TEXT',
  launchDate: 'DATETIME',
  isbn: 'TEXT',
  copyrightNo: 'TEXT',
  appRecordNo: 'TEXT',
  antiAddictionNo: 'TEXT',
  basePackageName: 'TEXT',
  notes: 'TEXT',
}

export async function ensureGameProjectSchema() {
  if (initialized) return

  const columns = await db.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info("Project")')
  const existing = new Set(columns.map((column) => column.name))

  for (const [name, type] of Object.entries(projectColumns)) {
    if (existing.has(name)) continue
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN "${name}" ${type}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.toLowerCase().includes('duplicate column')) throw error
    }
  }

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjectChannel" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "projectId" TEXT NOT NULL,
      "channelName" TEXT NOT NULL,
      "channelType" TEXT,
      "packageName" TEXT,
      "appId" TEXT,
      "owner" TEXT,
      "paramsStatus" TEXT NOT NULL DEFAULT 'pending',
      "packageStatus" TEXT NOT NULL DEFAULT 'pending',
      "testingStatus" TEXT NOT NULL DEFAULT 'pending',
      "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
      "launchStatus" TEXT NOT NULL DEFAULT 'pending',
      "notes" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectChannel_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjectFile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "projectId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'other',
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectFile_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProjectChannel_projectId_idx" ON "ProjectChannel"("projectId")')
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProjectChannel_projectId_sortOrder_idx" ON "ProjectChannel"("projectId", "sortOrder")')
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_idx" ON "ProjectFile"("projectId")')
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProjectFile_category_idx" ON "ProjectFile"("category")')

  initialized = true
}
