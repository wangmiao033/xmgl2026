/**
 * Server-side Neon HTTP transport. Never import from a client component.
 * The credential is an encrypted Vercel environment variable.
 * SQL values MUST be bound through params, not interpolated into the query string.
 */
type NeonResult = { rows?: Array<Array<string | null>>; fields?: Array<{ name: string }> }

export async function overseasQuery(query: string, params: Array<string> = []): Promise<Array<Record<string, string | null>>> {
  const connectionString = process.env.OVERSEAS_DATABASE_URL
  if (!connectionString) throw new Error('OVERSEAS_DATABASE_URL is not configured')
  const parsed = new URL(connectionString)
  if (!parsed.hostname.endsWith('.neon.tech')) throw new Error('Unexpected overseas database host')

  const response = await fetch('https://' + parsed.hostname + '/sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    body: JSON.stringify({ query, params }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Overseas database request failed: HTTP ' + response.status)
  const result = (await response.json()) as NeonResult
  if (!Array.isArray(result.rows) || !Array.isArray(result.fields)) throw new Error('Unexpected database response')
  return result.rows.map((row) => {
    const item: Record<string, string | null> = {}
    result.fields!.forEach((f, i) => { item[f.name] = row[i] ?? null })
    return item
  })
}
