import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.taskAssignee.deleteMany()
  await prisma.task.deleteMany()
  await prisma.taskColumn.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const defaultPassword = await hashPassword('xd2025')
  const wangmiaoPassword = '8b6a7b6ae0aba39ef19de7e2f8170a70:2885393dcb3993f15b6d1865e2f37a0da3b3fbc2494fb519709472ff74755f08f71ab9be344b2f7d2769c56ddb00043a91265141ea9902d757597688b3283e99'

  const user1 = await prisma.user.create({
    data: {
      email: 'zhangsan@company.com',
      name: '张三',
      avatar: '',
      role: 'admin',
      password: defaultPassword,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'lisi@company.com',
      name: '李四',
      avatar: '',
      role: 'manager',
      password: defaultPassword,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'wangwu@company.com',
      name: '王五',
      avatar: '',
      role: 'member',
      password: defaultPassword,
    },
  })

  await prisma.user.create({
    data: {
      email: 'wangmiao@dxyx6888.com',
      name: '王淼',
      avatar: '',
      role: 'admin',
      password: wangmiaoPassword,
    },
  })

  // ====== 5 Real Game Projects with WPS Document Links ======

  const project1 = await prisma.project.create({
    data: {
      name: '六界仙尊',
      description: '六界仙尊项目进度表，跟踪游戏开发各阶段进展情况',
      status: 'active',
      priority: 'high',
      category: 'game',
      docUrl: 'https://www.kdocs.cn/l/cvzGFC2D4p3s',
      docName: '六界仙尊进度表',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-09-30'),
      progress: 45,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: '一起来修仙',
      description: '一起来修仙接入进度项目10，管理渠道接入与联调任务',
      status: 'active',
      priority: 'urgent',
      category: 'game',
      docUrl: 'https://www.kdocs.cn/l/cfXdW9zcL3Qi',
      docName: '一起来修仙接入进度项目10',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-07-31'),
      progress: 30,
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: '创世封神',
      description: '创世封神玉狐&熊动.dbt，跟踪美术资源制作与审核进度',
      status: 'active',
      priority: 'high',
      category: 'game',
      docUrl: 'https://www.kdocs.cn/l/cosvmtydDOXk',
      docName: '创世封神 玉狐&熊动.dbt',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-10-31'),
      progress: 55,
    },
  })

  const project4 = await prisma.project.create({
    data: {
      name: '云上征途',
      description: '云上征途Q版仙侠上线计划，跟踪上线前各项准备工作进度',
      status: 'active',
      priority: 'urgent',
      category: 'game',
      docUrl: 'https://www.kdocs.cn/l/ckios8LeG4vV',
      docName: '云上征途 Q版仙侠 上线计划',
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-06-30'),
      progress: 70,
    },
  })

  const project5 = await prisma.project.create({
    data: {
      name: '龙吟大陆',
      description: '龙吟大陆上线计划，管理游戏上线全流程任务与里程碑',
      status: 'active',
      priority: 'high',
      category: 'game',
      docUrl: 'https://www.kdocs.cn/l/csnGGJ9cdFuc',
      docName: '龙吟大陆 上线计划',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-08-31'),
      progress: 40,
    },
  })

  // Create project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: user1.id, role: 'owner' },
      { projectId: project1.id, userId: user2.id, role: 'manager' },
      { projectId: project1.id, userId: user3.id, role: 'member' },
      { projectId: project2.id, userId: user1.id, role: 'manager' },
      { projectId: project2.id, userId: user2.id, role: 'member' },
      { projectId: project3.id, userId: user2.id, role: 'owner' },
      { projectId: project3.id, userId: user3.id, role: 'member' },
      { projectId: project4.id, userId: user1.id, role: 'owner' },
      { projectId: project4.id, userId: user2.id, role: 'manager' },
      { projectId: project4.id, userId: user3.id, role: 'member' },
      { projectId: project5.id, userId: user1.id, role: 'manager' },
      { projectId: project5.id, userId: user3.id, role: 'member' },
    ],
  })

  // Create task columns for each project
  const columnData = [
    // Project 1 columns
    { projectId: project1.id, title: '待办', order: 0 },
    { projectId: project1.id, title: '进行中', order: 1 },
    { projectId: project1.id, title: '审核中', order: 2 },
    { projectId: project1.id, title: '已完成', order: 3 },
    // Project 2 columns
    { projectId: project2.id, title: '待办', order: 0 },
    { projectId: project2.id, title: '进行中', order: 1 },
    { projectId: project2.id, title: '审核中', order: 2 },
    { projectId: project2.id, title: '已完成', order: 3 },
    // Project 3 columns
    { projectId: project3.id, title: '待办', order: 0 },
    { projectId: project3.id, title: '进行中', order: 1 },
    { projectId: project3.id, title: '审核中', order: 2 },
    { projectId: project3.id, title: '已完成', order: 3 },
    // Project 4 columns
    { projectId: project4.id, title: '待办', order: 0 },
    { projectId: project4.id, title: '进行中', order: 1 },
    { projectId: project4.id, title: '审核中', order: 2 },
    { projectId: project4.id, title: '已完成', order: 3 },
    // Project 5 columns
    { projectId: project5.id, title: '待办', order: 0 },
    { projectId: project5.id, title: '进行中', order: 1 },
    { projectId: project5.id, title: '审核中', order: 2 },
    { projectId: project5.id, title: '已完成', order: 3 },
  ]

  const columns = await Promise.all(
    columnData.map((col) => prisma.taskColumn.create({ data: col }))
  )

  // Create game-development-specific tasks
  const taskData = [
    // ===== 六界仙尊 (Project 1) =====
    {
      title: '核心战斗系统开发',
      description: '实现回合制/即时制战斗核心逻辑与技能系统',
      status: 'in_progress',
      priority: 'urgent',
      order: 0,
      projectId: project1.id,
      columnId: columns[1].id,
      dueDate: new Date('2025-04-15'),
    },
    {
      title: '角色建模与动画',
      description: '完成主角及主要NPC的3D建模和骨骼动画制作',
      status: 'in_progress',
      priority: 'high',
      order: 1,
      projectId: project1.id,
      columnId: columns[1].id,
      dueDate: new Date('2025-05-01'),
    },
    {
      title: '场景地图设计',
      description: '完成六界各场景的概念设计与3D建模',
      status: 'todo',
      priority: 'high',
      order: 0,
      projectId: project1.id,
      columnId: columns[0].id,
      dueDate: new Date('2025-06-15'),
    },
    {
      title: 'UI界面设计',
      description: '设计并实现游戏主界面、背包、技能面板等UI',
      status: 'review',
      priority: 'medium',
      order: 0,
      projectId: project1.id,
      columnId: columns[2].id,
      dueDate: new Date('2025-03-31'),
    },
    {
      title: '服务器架构搭建',
      description: '搭建游戏服务器基础架构与通信协议',
      status: 'done',
      priority: 'urgent',
      order: 0,
      projectId: project1.id,
      columnId: columns[3].id,
      dueDate: new Date('2025-02-28'),
    },
    // ===== 一起来修仙 (Project 2) =====
    {
      title: '华为渠道SDK接入',
      description: '完成华为应用市场SDK的接入与测试',
      status: 'done',
      priority: 'urgent',
      order: 0,
      projectId: project2.id,
      columnId: columns[7].id,
      dueDate: new Date('2025-03-15'),
    },
    {
      title: 'OPPO渠道联调',
      description: 'OPPO应用商店SDK接入与支付联调',
      status: 'in_progress',
      priority: 'urgent',
      order: 0,
      projectId: project2.id,
      columnId: columns[5].id,
      dueDate: new Date('2025-04-30'),
    },
    {
      title: 'vivo渠道接入',
      description: 'vivo应用商店SDK接入与功能验证',
      status: 'todo',
      priority: 'high',
      order: 0,
      projectId: project2.id,
      columnId: columns[4].id,
      dueDate: new Date('2025-05-15'),
    },
    {
      title: '小米渠道联调',
      description: '小米游戏中心SDK接入与支付测试',
      status: 'todo',
      priority: 'high',
      order: 1,
      projectId: project2.id,
      columnId: columns[4].id,
      dueDate: new Date('2025-05-31'),
    },
    {
      title: 'B站渠道接入',
      description: '哔哩哔哩游戏中心SDK接入与联调',
      status: 'todo',
      priority: 'medium',
      order: 2,
      projectId: project2.id,
      columnId: columns[4].id,
      dueDate: new Date('2025-06-15'),
    },
    // ===== 创世封神 (Project 3) =====
    {
      title: '玉狐角色美术设计',
      description: '完成玉狐角色的概念设计、立绘和3D模型',
      status: 'in_progress',
      priority: 'urgent',
      order: 0,
      projectId: project3.id,
      columnId: columns[9].id,
      dueDate: new Date('2025-04-20'),
    },
    {
      title: '熊动角色美术设计',
      description: '完成熊动角色的概念设计、立绘和3D模型',
      status: 'review',
      priority: 'high',
      order: 0,
      projectId: project3.id,
      columnId: columns[10].id,
      dueDate: new Date('2025-04-10'),
    },
    {
      title: '角色特效制作',
      description: '为玉狐和熊动设计技能特效和出场动画',
      status: 'todo',
      priority: 'medium',
      order: 0,
      projectId: project3.id,
      columnId: columns[8].id,
      dueDate: new Date('2025-06-01'),
    },
    {
      title: '角色动作捕捉',
      description: '完成角色基础动作和战斗动作的动捕数据采集',
      status: 'done',
      priority: 'high',
      order: 0,
      projectId: project3.id,
      columnId: columns[11].id,
      dueDate: new Date('2025-03-15'),
    },
    // ===== 云上征途 (Project 4) =====
    {
      title: '服务器压力测试',
      description: '完成服务器高并发压力测试和性能优化',
      status: 'in_progress',
      priority: 'urgent',
      order: 0,
      projectId: project4.id,
      columnId: columns[13].id,
      dueDate: new Date('2025-05-01'),
    },
    {
      title: '版本号与包体优化',
      description: '优化安装包体积，完成最终版本号确认',
      status: 'review',
      priority: 'high',
      order: 0,
      projectId: project4.id,
      columnId: columns[14].id,
      dueDate: new Date('2025-04-25'),
    },
    {
      title: '应用商店素材提交',
      description: '准备并提交各渠道应用商店所需截图、视频和文案',
      status: 'todo',
      priority: 'high',
      order: 0,
      projectId: project4.id,
      columnId: columns[12].id,
      dueDate: new Date('2025-05-15'),
    },
    {
      title: '上线合规审查',
      description: '完成版号、防沉迷、隐私政策等合规审查',
      status: 'done',
      priority: 'urgent',
      order: 0,
      projectId: project4.id,
      columnId: columns[15].id,
      dueDate: new Date('2025-03-31'),
    },
    {
      title: '灰度测试',
      description: '执行小范围灰度测试并收集用户反馈',
      status: 'done',
      priority: 'high',
      order: 1,
      projectId: project4.id,
      columnId: columns[15].id,
      dueDate: new Date('2025-04-10'),
    },
    // ===== 龙吟大陆 (Project 5) =====
    {
      title: '主线剧情编写',
      description: '完成游戏主线剧情脚本和分支剧情设计',
      status: 'in_progress',
      priority: 'high',
      order: 0,
      projectId: project5.id,
      columnId: columns[17].id,
      dueDate: new Date('2025-05-15'),
    },
    {
      title: '坐骑系统开发',
      description: '实现坐骑获取、培养、进阶和骑乘系统',
      status: 'todo',
      priority: 'medium',
      order: 0,
      projectId: project5.id,
      columnId: columns[16].id,
      dueDate: new Date('2025-06-30'),
    },
    {
      title: '公会系统开发',
      description: '实现公会创建、管理、战争等核心功能',
      status: 'todo',
      priority: 'high',
      order: 1,
      projectId: project5.id,
      columnId: columns[16].id,
      dueDate: new Date('2025-07-15'),
    },
    {
      title: '新手引导设计',
      description: '设计并实现新手引导流程和教程关卡',
      status: 'review',
      priority: 'medium',
      order: 0,
      projectId: project5.id,
      columnId: columns[18].id,
      dueDate: new Date('2025-04-30'),
    },
    {
      title: '音效与背景音乐',
      description: '完成游戏BGM和主要音效的制作与接入',
      status: 'done',
      priority: 'low',
      order: 0,
      projectId: project5.id,
      columnId: columns[19].id,
      dueDate: new Date('2025-03-31'),
    },
  ]

  const tasks = await Promise.all(
    taskData.map((task) => prisma.task.create({ data: task }))
  )

  // Create task assignees
  await prisma.taskAssignee.createMany({
    data: [
      // 六界仙尊
      { taskId: tasks[0].id, userId: user1.id },
      { taskId: tasks[0].id, userId: user3.id },
      { taskId: tasks[1].id, userId: user2.id },
      { taskId: tasks[2].id, userId: user2.id },
      { taskId: tasks[3].id, userId: user3.id },
      { taskId: tasks[4].id, userId: user1.id },
      // 一起来修仙
      { taskId: tasks[5].id, userId: user1.id },
      { taskId: tasks[6].id, userId: user1.id },
      { taskId: tasks[6].id, userId: user3.id },
      { taskId: tasks[7].id, userId: user2.id },
      { taskId: tasks[8].id, userId: user2.id },
      { taskId: tasks[9].id, userId: user3.id },
      // 创世封神
      { taskId: tasks[10].id, userId: user2.id },
      { taskId: tasks[11].id, userId: user2.id },
      { taskId: tasks[12].id, userId: user3.id },
      { taskId: tasks[13].id, userId: user1.id },
      // 云上征途
      { taskId: tasks[14].id, userId: user1.id },
      { taskId: tasks[14].id, userId: user2.id },
      { taskId: tasks[15].id, userId: user3.id },
      { taskId: tasks[16].id, userId: user2.id },
      { taskId: tasks[17].id, userId: user1.id },
      { taskId: tasks[18].id, userId: user1.id },
      // 龙吟大陆
      { taskId: tasks[19].id, userId: user2.id },
      { taskId: tasks[20].id, userId: user3.id },
      { taskId: tasks[21].id, userId: user1.id },
      { taskId: tasks[21].id, userId: user3.id },
      { taskId: tasks[22].id, userId: user2.id },
      { taskId: tasks[23].id, userId: user3.id },
    ],
  })

  // ====== Sample Password Entries ======
  await prisma.passwordEntry.createMany({
    data: [
      {
        title: '华为开发者平台',
        url: 'https://developer.huawei.com',
        username: 'demo-huawei@example.com',
        password: 'demo-password-huawei',
        email: 'demo-huawei@example.com',
        category: 'game',
        notes: '华为渠道开发者账号，用于SDK接入和游戏提审',
      },
      {
        title: 'OPPO开放平台',
        url: 'https://open.oppomobile.com',
        username: 'demo_oppo',
        password: 'demo-password-oppo',
        category: 'game',
        notes: 'OPPO游戏开发者平台，用于应用发布和支付配置',
      },
      {
        title: 'vivo游戏开发者',
        url: 'https://dev.vivo.com.cn',
        username: 'demo-vivo@example.com',
        password: 'demo-password-vivo',
        category: 'game',
        notes: 'vivo游戏中心开发者账号',
      },
      {
        title: '小米游戏中心',
        url: 'https://dev.mi.com',
        username: 'demo_mi',
        password: 'demo-password-mi',
        category: 'game',
        notes: '小米开发者平台，游戏发布渠道',
      },
      {
        title: 'B站游戏中心',
        url: 'https://game.bilibili.com',
        username: 'demo_bilibili',
        password: 'demo-password-bilibili',
        category: 'game',
        notes: '哔哩哔哩游戏中心开发者后台',
      },
      {
        title: '金山区文档',
        url: 'https://www.kdocs.cn',
        username: 'demo-kdocs@example.com',
        password: 'demo-password-kdocs',
        category: 'tool',
        notes: '金山文档企业账号',
      },
      {
        title: '企业邮箱',
        url: 'https://mail.company.com',
        username: 'demo-mail@example.com',
        password: 'demo-password-mail',
        email: 'demo-mail@example.com',
        category: 'website',
        notes: '公司企业邮箱管理员账号',
      },
      {
        title: '服务器管理面板',
        url: 'https://server.company.com:8888',
        username: 'demo_admin',
        password: 'demo-password-server',
        category: 'server',
        notes: '游戏服务器管理后台，生产环境',
      },
    ],
  })

  console.log('Seed data created successfully!')
  console.log(`- 3 users created`)
  console.log(`- 5 game projects created (with WPS document links)`)
  console.log(`- 12 project members created`)
  console.log(`- 20 task columns created`)
  console.log(`- 24 tasks created`)
  console.log(`- 27 task assignees created`)
  console.log(`- 8 password entries created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
