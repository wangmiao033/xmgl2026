import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

// Smart categorization based on entry content
function categorize(name: string, url: string, notes: string, entity: string): string {
  const text = `${name} ${url} ${notes} ${entity}`.toLowerCase()

  // Cloud/Server
  if (/华为云|阿里云|腾讯云|服务器/.test(text)) return 'server'
  // Game backends
  if (/后台|管理面板|GM|gm|传奇|修仙|三国|王者|唤歌|骑士|魔戒/.test(text)) return 'game'
  // Social media
  if (/微博|b站|哔哩|tiktok|抖音|快手|贴吧|飞书/.test(text)) return 'social'
  // Financial/Tax tools
  if (/财务|纳税|金蝶|结算|对账|合同|电子合同/.test(text)) return 'tool'
  // Email
  if (/邮箱/.test(text)) return 'tool'
  // Copyright/Registration
  if (/软著|版权|备案|防沉迷|反沉迷|算法/.test(text)) return 'tool'
  // Channel/Developer platforms (most entries)
  if (/开发者|开放平台|渠道|华为|oppo|vivo|小米|三星|魅族|联想|努比亚|360|百度|4399|当乐|果盘|九游|应用宝|摸摸鱼|taptap|好游快爆|233|雷电/.test(text)) return 'channel'
  // Distribution platforms
  if (/聚合|手游|小7|咪噜|虫虫|3733|7723|3387|一元|赏金|闪趣|梨子|八门|BTGO|早游戏|米粒游|穿山甲|蒲公英|U2game|冰火/.test(text)) return 'channel'
  // E-commerce
  if (/淘宝|支付宝|京东/.test(text)) return 'channel'
  // App store
  if (/苹果|app\s?store/.test(text)) return 'channel'
  // Quick app
  if (/快应用|小游戏/.test(text)) return 'channel'
  // Data backend
  if (/QK|quicksdk|数据后台/.test(text)) return 'tool'
  // IP tools
  if (/ip归属地/.test(text)) return 'tool'
  // QQ
  if (/QQ/.test(text)) return 'social'
  // Remaining with entity info
  if (entity && /熊动|超凡/.test(entity)) return 'channel'
  // Default
  return 'other'
}

async function main() {
  if (!process.env.IMPORT_PASSWORDS_XLSX_PATH) {
    throw new Error('Set IMPORT_PASSWORDS_XLSX_PATH to the Excel file path before importing passwords.')
  }

  const filePath = path.resolve(process.env.IMPORT_PASSWORDS_XLSX_PATH)
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, string | undefined>>(sheet, { defval: '' })

  console.log(`Sheet: ${sheetName}, Total rows: ${rows.length}`)

  // Clear existing password entries
  const deleteResult = await prisma.passwordEntry.deleteMany({})
  console.log(`Cleared ${deleteResult.count} existing password entries`)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Skip header row
    if (i === 0 && row['渠道名称'] === '渠道名称') continue

    const name = String(row['渠道名称'] || '').trim()
    const entity = String(row['主体'] || '').trim()
    const url = String(row['【登录】后台链接'] || '').trim()
    const username = String(row['账号'] || '').trim()
    const password = String(row['密码'] || '').trim()
    const updateDate = String(row['更新日期'] || '').trim()
    const notes = String(row['备注'] || '').trim()

    // Build composite title
    const title = name || (url ? url.split('/').filter(Boolean).pop() || url : '')

    // Skip rows with no meaningful data
    if (!title && !url && !username && !password) {
      skipped++
      continue
    }

    // Build notes from multiple fields
    const notesParts: string[] = []
    if (entity) notesParts.push(`主体: ${entity}`)
    if (updateDate) notesParts.push(`更新: ${updateDate}`)
    if (notes) notesParts.push(notes)
    const combinedNotes = notesParts.length > 0 ? notesParts.join(' | ') : null

    const category = categorize(name, url, combinedNotes || '', entity)

    try {
      await prisma.passwordEntry.create({
        data: {
          title: title || '未命名',
          url: url && url.startsWith('http') ? url : (url ? `https://${url}` : null),
          username: username || null,
          password: password || '未设置',
          notes: combinedNotes,
          category,
          isFavorite: false,
        },
      })
      imported++
    } catch (err: any) {
      errors.push(`Row ${i + 2} (${name}): ${err.message}`)
    }
  }

  console.log(`\nImport complete!`)
  console.log(`  Imported: ${imported}`)
  console.log(`  Skipped: ${skipped}`)
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    errors.forEach(e => console.log(`    - ${e}`))
  }

  // Print category summary
  const summary = await prisma.passwordEntry.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  })
  console.log(`\nCategory summary:`)
  for (const s of summary) {
    console.log(`  ${s.category}: ${s._count.category}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
