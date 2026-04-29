import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 安全种子脚本 - 仅添加工具分类和工具书签，不触碰用户、项目、任务等数据
 * 使用 upsert 确保幂等性，可安全重复运行
 */
async function main() {
  console.log('🔧 Safe seed: only adding tool categories and tools...')
  console.log('⚠️  This will NOT touch users, projects, tasks, or passwords.\n')

  // ====== Tool Categories (upsert by name) ======
  const toolCategoriesData = [
    { name: '运营平台', icon: 'Megaphone', color: 'orange', order: 0 },
    { name: '财务管理', icon: 'Wallet', color: 'emerald', order: 1 },
    { name: '开发工具', icon: 'Code2', color: 'sky', order: 2 },
    { name: '隐私合规', icon: 'ShieldCheck', color: 'violet', order: 3 },
    { name: '渠道商店', icon: 'Gamepad2', color: 'amber', order: 4 },
    { name: '设计资源', icon: 'Palette', color: 'rose', order: 5 },
    { name: '办公协作', icon: 'LayoutGrid', color: 'teal', order: 6 },
    { name: '数据分析', icon: 'Calculator', color: 'slate', order: 7 },
  ]

  const categoryMap: Record<string, string> = {}

  for (const catData of toolCategoriesData) {
    const cat = await prisma.toolCategory.upsert({
      where: { id: `seed-${catData.name}` },
      update: { icon: catData.icon, color: catData.color, order: catData.order },
      create: { id: `seed-${catData.name}`, ...catData },
    })
    categoryMap[catData.name] = cat.id
  }

  console.log(`✅ ${toolCategoriesData.length} categories ready`)

  // ====== Tools (upsert by deterministic ID) ======
  const toolsData = [
    // 运营平台
    { name: 'TapTap 开发者中心', url: 'https://www.taptap.cn/', description: 'TapTap 游戏分发与运营管理平台，管理游戏上架、版本发布和数据监控', icon: 'Globe', color: 'orange', order: 0, category: '运营平台' },
    { name: 'Apple App Store Connect', url: 'https://appstoreconnect.apple.com/apps/6758362827/distribution/reviewsubmissions', description: 'Apple 应用商店开发者后台，管理 iOS 版本提交、审核和发布', icon: 'Apple', color: 'orange', order: 1, category: '运营平台' },
    { name: '大熊平台', url: 'https://www.daxiong.com/', description: '大熊游戏数据分析与运营管理平台', icon: 'Server', color: 'orange', order: 2, category: '运营平台' },
    { name: '好游快爆', url: 'https://www.3839.com/', description: '好游快爆游戏社区运营平台，管理游戏推广和用户互动', icon: 'Globe', color: 'orange', order: 3, category: '运营平台' },

    // 财务管理
    { name: '财务管理系统', url: 'https://finance.dxyx6888.com/', description: '公司内部财务管理系统，查看收入报表、支出明细和预算数据', icon: 'Wallet', color: 'emerald', order: 0, category: '财务管理' },
    { name: '发票管理', url: 'https://invoice.dxyx6888.com/', description: '电子发票开具、查验和管理平台', icon: 'FileText', color: 'emerald', order: 1, category: '财务管理' },
    { name: '金蝶云星空', url: 'https://www.kingdee.com/', description: '企业财务管理与 ERP 系统，管理财务核算、供应链和人力资源', icon: 'Calculator', color: 'emerald', order: 2, category: '财务管理' },
    { name: '支付宝商家平台', url: 'https://b.alipay.com/', description: '支付宝商户后台，查看交易流水、对账单和结算信息', icon: 'Wallet', color: 'emerald', order: 3, category: '财务管理' },

    // 开发工具
    { name: 'GitHub', url: 'https://github.com/', description: '代码版本管理与协作平台，管理项目源代码和 CI/CD', icon: 'Code2', color: 'sky', order: 0, category: '开发工具' },
    { name: 'GitLab', url: 'https://gitlab.com/', description: '私有化代码托管平台，管理内部项目代码仓库', icon: 'Code2', color: 'sky', order: 1, category: '开发工具' },
    { name: 'Jenkins', url: 'https://jenkins.io/', description: '持续集成与部署工具，自动化构建、测试和发布流程', icon: 'Server', color: 'sky', order: 2, category: '开发工具' },
    { name: 'Jira', url: 'https://www.atlassian.com/software/jira', description: '项目问题跟踪与敏捷管理工具', icon: 'FileCheck', color: 'sky', order: 3, category: '开发工具' },

    // 隐私合规
    { name: '隐私政策工具', url: 'https://privacy.dxyx6888.com/', description: '游戏隐私政策生成与管理工具，确保合规运营', icon: 'ShieldCheck', color: 'violet', order: 0, category: '隐私合规' },
    { name: '国家新闻出版署', url: 'https://www.nppa.gov.cn/', description: '游戏版号申报与查询，管理游戏出版合规事项', icon: 'FileCheck', color: 'violet', order: 1, category: '隐私合规' },
    { name: '防沉迷系统', url: 'https://www.youmian.cn/', description: '网络游戏防沉迷实名认证系统接入与管理', icon: 'ShieldCheck', color: 'violet', order: 2, category: '隐私合规' },

    // 渠道商店
    { name: '华为应用市场', url: 'https://developer.huawei.com/', description: '华为游戏中心开发者后台，SDK 接入与游戏发布管理', icon: 'Globe', color: 'amber', order: 0, category: '渠道商店' },
    { name: 'OPPO 开放平台', url: 'https://open.oppomobile.com/', description: 'OPPO 应用商店开发者平台，游戏发布与支付配置', icon: 'Globe', color: 'amber', order: 1, category: '渠道商店' },
    { name: 'vivo 游戏开发者', url: 'https://dev.vivo.com.cn/', description: 'vivo 游戏中心开发者后台，SDK 接入与联调测试', icon: 'Globe', color: 'amber', order: 2, category: '渠道商店' },
    { name: '小米游戏中心', url: 'https://dev.mi.com/', description: '小米开发者平台，游戏发布渠道与数据统计', icon: 'Globe', color: 'amber', order: 3, category: '渠道商店' },
    { name: 'B站游戏中心', url: 'https://game.bilibili.com/', description: '哔哩哔哩游戏中心开发者后台', icon: 'Globe', color: 'amber', order: 4, category: '渠道商店' },

    // 设计资源
    { name: 'Figma', url: 'https://www.figma.com/', description: '在线协作 UI 设计工具，游戏界面设计与原型制作', icon: 'Palette', color: 'rose', order: 0, category: '设计资源' },
    { name: '蓝湖', url: 'https://lanhuapp.com/', description: '设计稿标注与开发交付平台，UI 设计切图与标注', icon: 'Palette', color: 'rose', order: 1, category: '设计资源' },
    { name: 'PixPin', url: 'https://pixpin.app/', description: '截图、贴图与取色工具，日常设计辅助', icon: 'Palette', color: 'rose', order: 2, category: '设计资源' },

    // 办公协作
    { name: '金山文档', url: 'https://www.kdocs.cn/', description: '在线文档协作平台，项目文档、进度表和会议记录', icon: 'FileText', color: 'teal', order: 0, category: '办公协作' },
    { name: '飞书', url: 'https://www.feishu.cn/', description: '企业协作平台，即时通讯、文档协作和项目管理', icon: 'LayoutGrid', color: 'teal', order: 1, category: '办公协作' },
    { name: '腾讯会议', url: 'https://meeting.tencent.com/', description: '在线视频会议平台，远程沟通与项目评审', icon: 'LayoutGrid', color: 'teal', order: 2, category: '办公协作' },

    // 数据分析
    { name: 'TalkingData', url: 'https://www.talkingdata.com/', description: '游戏数据分析平台，用户行为追踪与漏斗分析', icon: 'Calculator', color: 'slate', order: 0, category: '数据分析' },
    { name: '神策数据', url: 'https://www.sensorsdata.cn/', description: '用户行为分析平台，游戏留存与付费数据分析', icon: 'Calculator', color: 'slate', order: 1, category: '数据分析' },
  ]

  let createdCount = 0
  let updatedCount = 0

  for (const tool of toolsData) {
    const id = `seed-${tool.category}-${tool.name}`
    const categoryId = categoryMap[tool.category]
    if (!categoryId) {
      console.warn(`⚠️  Category "${tool.category}" not found, skipping tool: ${tool.name}`)
      continue
    }

    const existing = await prisma.tool.findUnique({ where: { id } })
    if (existing) {
      await prisma.tool.update({
        where: { id },
        data: { name: tool.name, url: tool.url, description: tool.description, icon: tool.icon, color: tool.color, order: tool.order, categoryId },
      })
      updatedCount++
    } else {
      await prisma.tool.create({
        data: { id, name: tool.name, url: tool.url, description: tool.description, icon: tool.icon, color: tool.color, order: tool.order, categoryId },
      })
      createdCount++
    }
  }

  console.log(`✅ ${createdCount} tools created, ${updatedCount} tools updated`)
  console.log('\n🎉 Safe seed completed! Users, projects, and tasks were NOT touched.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
