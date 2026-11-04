import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/with-auth'
import { overseasQuery } from '@/lib/overseas-db'
import { createEmptyOpportunity, type Opportunity, type ValidationKey, type VerificationStatus } from '@/types/overseas-opportunity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EDITABLE_KEYS: (keyof Opportunity)[] = [
  'company', 'country', 'region', 'contact', 'project', 'type', 'stage',
  'sourceUrl', 'sourceDate', 'confirmed', 'unverified', 'quote', 'payment',
  'contract', 'nextAction', 'due', 'notes', 'priority', 'replyOwner', 'prework',
  'acceptance', 'lastUpdated', 'employment', 'evidence',
]
const VALIDATION_KEYS: ValidationKey[] = ['investment', 'distribution', 'cases', 'payment']
const VALIDATION_STATES: VerificationStatus[] = ['已验证', '待核实', '不适用']
const privateHeaders = { 'Cache-Control': 'private, no-store' }

async function ensureOwner(request: NextRequest) {
  const auth = await authenticate(request)
  if ('error' in auth) return { error: auth.error }
  // This board contains confidential negotiation/financial data.
  if (auth.session.role !== 'admin') {
    return { error: NextResponse.json({ error: '仅管理员可访问海外合作台账' }, { status: 403, headers: privateHeaders }) }
  }
  return { user: auth.session }
}

function cleanInput(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const data = raw as Record<string, unknown>
  const clean = createEmptyOpportunity()
  for (const key of EDITABLE_KEYS) {
    const value = data[key]
    if (value !== undefined && typeof value !== 'string') return null
    const max = ['notes', 'confirmed', 'unverified', 'evidence'].includes(key) ? 12000 : 3000
    // JSON object keys use known whitelisted names only.
    ;(clean as unknown as Record<string, unknown>)[key] = (value || '').toString().trim().slice(0, max)
  }
  if (!clean.company || !clean.project) return null
  if (clean.sourceUrl && !/^https?:\/\/\S+$/i.test(clean.sourceUrl)) return null
  if (clean.sourceDate && !/^\d{4}-\d{2}-\d{2}$/.test(clean.sourceDate)) return null
  if (clean.due && !/^\d{4}-\d{2}-\d{2}$/.test(clean.due)) return null
  const inputValidation = data.validation
  if (inputValidation && (typeof inputValidation !== 'object' || Array.isArray(inputValidation))) return null
  for (const key of VALIDATION_KEYS) {
    const item = (inputValidation as Record<string, unknown> | undefined)?.[key]
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const source = item as Record<string, unknown>
      const status: VerificationStatus = VALIDATION_STATES.includes(source.status as VerificationStatus)
        ? source.status as VerificationStatus : '待核实'
      clean.validation[key] = { status, evidence: typeof source.evidence === 'string' ? source.evidence.slice(0, 4000) : '' }
    }
  }
  return clean
}

function rowToOpportunity(row: Record<string, string | null>): Opportunity {
  const parsed = JSON.parse(row.data || '{}') as Opportunity
  return {
    ...createEmptyOpportunity(), ...parsed,
    id: row.id || '',
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
  }
}

export async function GET(request: NextRequest) {
  const auth = await ensureOwner(request)
  if (auth.error) return auth.error
  try {
    const rows = await overseasQuery('SELECT id, data::text AS data, created_at::text AS "createdAt", updated_at::text AS "updatedAt" FROM overseas_opportunities ORDER BY updated_at DESC LIMIT 1000')
    return NextResponse.json(rows.map(rowToOpportunity), { headers: privateHeaders })
  } catch (error) {
    console.error('[overseas] GET failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: '读取海外合作记录失败' }, { status: 503, headers: privateHeaders })
  }
}

export async function POST(request: NextRequest) {
  const auth = await ensureOwner(request)
  if (auth.error) return auth.error
  let raw: unknown
  try { raw = await request.json() } catch { return NextResponse.json({ error: 'JSON 无效' }, { status: 400 }) }
  const data = cleanInput(raw)
  if (!data) return NextResponse.json({ error: '请填写公司与项目名称，检查字段格式' }, { status: 400 })
  try {
    const id = randomUUID()
    const rows = await overseasQuery(
      'INSERT INTO overseas_opportunities(id, data) VALUES ($1, $2::jsonb) RETURNING id, data::text AS data, created_at::text AS "createdAt", updated_at::text AS "updatedAt"',
      [id, JSON.stringify(data)],
    )
    return NextResponse.json(rowToOpportunity(rows[0]), { status: 201, headers: privateHeaders })
  } catch (error) {
    console.error('[overseas] POST failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: '保存失败' }, { status: 503, headers: privateHeaders })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await ensureOwner(request)
  if (auth.error) return auth.error
  let raw: Record<string, unknown>
  try { raw = await request.json() } catch { return NextResponse.json({ error: 'JSON 无效' }, { status: 400 }) }
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id || id.length > 128) return NextResponse.json({ error: '记录 ID 无效' }, { status: 400 })
  const data = cleanInput(raw)
  if (!data) return NextResponse.json({ error: '请填写公司与项目名称，检查字段格式' }, { status: 400 })
  try {
    const rows = await overseasQuery(
      'UPDATE overseas_opportunities SET data = $2::jsonb, updated_at = now() WHERE id = $1 RETURNING id, data::text AS data, created_at::text AS "createdAt", updated_at::text AS "updatedAt"',
      [id, JSON.stringify(data)],
    )
    if (!rows.length) return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    return NextResponse.json(rowToOpportunity(rows[0]), { headers: privateHeaders })
  } catch (error) {
    console.error('[overseas] PATCH failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: '保存失败' }, { status: 503, headers: privateHeaders })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await ensureOwner(request)
  if (auth.error) return auth.error
  const id = request.nextUrl.searchParams.get('id') || ''
  if (!id || id.length > 128) return NextResponse.json({ error: '记录 ID 无效' }, { status: 400 })
  try {
    const rows = await overseasQuery('DELETE FROM overseas_opportunities WHERE id = $1 RETURNING id', [id])
    if (!rows.length) return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    return NextResponse.json({ ok: true }, { headers: privateHeaders })
  } catch (error) {
    console.error('[overseas] DELETE failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: '删除失败' }, { status: 503, headers: privateHeaders })
  }
}
