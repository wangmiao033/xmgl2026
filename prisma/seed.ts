import { PrismaClient } from '@prisma/client'

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
  const user1 = await prisma.user.create({
    data: {
      email: 'zhangsan@company.com',
      name: '张三',
      avatar: '',
      role: 'admin',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'lisi@company.com',
      name: '李四',
      avatar: '',
      role: 'manager',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'wangwu@company.com',
      name: '王五',
      avatar: '',
      role: 'member',
    },
  })

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: '官网重构项目',
      description: '公司官方网站全面升级改版，采用新技术栈提升性能和用户体验',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      progress: 65,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: '移动端APP开发',
      description: '开发公司移动端应用，覆盖iOS和Android双平台',
      status: 'active',
      priority: 'urgent',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-31'),
      progress: 35,
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: '内部管理系统优化',
      description: '优化现有内部管理系统的性能和功能模块',
      status: 'paused',
      priority: 'medium',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      progress: 80,
    },
  })

  const project4 = await prisma.project.create({
    data: {
      name: '数据分析平台',
      description: '搭建企业级数据分析平台，支持多维度数据可视化',
      status: 'completed',
      priority: 'high',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2024-02-28'),
      progress: 100,
    },
  })

  // Create project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: user1.id, role: 'owner' },
      { projectId: project1.id, userId: user2.id, role: 'manager' },
      { projectId: project1.id, userId: user3.id, role: 'member' },
      { projectId: project2.id, userId: user1.id, role: 'manager' },
      { projectId: project2.id, userId: user3.id, role: 'member' },
      { projectId: project3.id, userId: user2.id, role: 'owner' },
      { projectId: project3.id, userId: user1.id, role: 'member' },
      { projectId: project4.id, userId: user2.id, role: 'owner' },
      { projectId: project4.id, userId: user3.id, role: 'member' },
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
  ]

  const columns = await Promise.all(
    columnData.map((col) => prisma.taskColumn.create({ data: col }))
  )

  // Create tasks
  const taskData = [
    // Project 1 tasks
    {
      title: '设计首页原型图',
      description: '根据需求文档完成首页UI原型设计',
      status: 'done',
      priority: 'high',
      order: 0,
      projectId: project1.id,
      columnId: columns[3].id, // 已完成
      dueDate: new Date('2024-02-15'),
    },
    {
      title: '开发用户登录模块',
      description: '实现用户注册、登录、找回密码功能',
      status: 'done',
      priority: 'urgent',
      order: 1,
      projectId: project1.id,
      columnId: columns[3].id,
      dueDate: new Date('2024-03-01'),
    },
    {
      title: '产品详情页面开发',
      description: '开发产品展示、详情、搜索页面',
      status: 'review',
      priority: 'high',
      order: 0,
      projectId: project1.id,
      columnId: columns[2].id, // 审核中
      dueDate: new Date('2024-04-15'),
    },
    {
      title: '购物车功能实现',
      description: '实现购物车添加、删除、修改数量等功能',
      status: 'in_progress',
      priority: 'medium',
      order: 0,
      projectId: project1.id,
      columnId: columns[1].id, // 进行中
      dueDate: new Date('2024-04-30'),
    },
    {
      title: '支付接口对接',
      description: '对接支付宝和微信支付接口',
      status: 'todo',
      priority: 'high',
      order: 0,
      projectId: project1.id,
      columnId: columns[0].id, // 待办
      dueDate: new Date('2024-05-15'),
    },
    // Project 2 tasks
    {
      title: 'APP技术选型',
      description: '确定移动端技术框架和开发工具',
      status: 'done',
      priority: 'urgent',
      order: 0,
      projectId: project2.id,
      columnId: columns[7].id, // 已完成
      dueDate: new Date('2024-02-28'),
    },
    {
      title: '用户界面设计',
      description: '完成APP所有页面的UI设计',
      status: 'in_progress',
      priority: 'high',
      order: 0,
      projectId: project2.id,
      columnId: columns[5].id, // 进行中
      dueDate: new Date('2024-04-01'),
    },
    {
      title: '消息推送功能',
      description: '实现APP消息推送功能',
      status: 'todo',
      priority: 'medium',
      order: 0,
      projectId: project2.id,
      columnId: columns[4].id, // 待办
      dueDate: new Date('2024-06-01'),
    },
    {
      title: '离线缓存方案',
      description: '设计并实现APP离线数据缓存方案',
      status: 'todo',
      priority: 'low',
      order: 1,
      projectId: project2.id,
      columnId: columns[4].id,
      dueDate: new Date('2024-07-01'),
    },
    // Project 3 tasks
    {
      title: '权限系统重构',
      description: '重构角色权限管理系统',
      status: 'done',
      priority: 'high',
      order: 0,
      projectId: project3.id,
      columnId: columns[11].id, // 已完成
      dueDate: new Date('2024-03-31'),
    },
    {
      title: '审批流程优化',
      description: '优化内部审批流程，提升处理效率',
      status: 'review',
      priority: 'medium',
      order: 0,
      projectId: project3.id,
      columnId: columns[10].id, // 审核中
      dueDate: new Date('2024-04-30'),
    },
    {
      title: '报表导出功能',
      description: '增加多种格式报表导出功能',
      status: 'todo',
      priority: 'low',
      order: 0,
      projectId: project3.id,
      columnId: columns[8].id, // 待办
      dueDate: new Date('2024-05-15'),
    },
    // Project 4 tasks
    {
      title: '数据可视化模块',
      description: '开发图表展示和数据可视化功能',
      status: 'done',
      priority: 'high',
      order: 0,
      projectId: project4.id,
      columnId: columns[15].id, // 已完成
      dueDate: new Date('2024-01-31'),
    },
    {
      title: '数据导出功能',
      description: '支持CSV和Excel格式数据导出',
      status: 'done',
      priority: 'medium',
      order: 1,
      projectId: project4.id,
      columnId: columns[15].id,
      dueDate: new Date('2024-02-15'),
    },
    {
      title: '用户行为分析',
      description: '实现用户行为追踪和分析功能',
      status: 'done',
      priority: 'high',
      order: 2,
      projectId: project4.id,
      columnId: columns[15].id,
      dueDate: new Date('2024-02-28'),
    },
  ]

  const tasks = await Promise.all(
    taskData.map((task) => prisma.task.create({ data: task }))
  )

  // Create task assignees
  await prisma.taskAssignee.createMany({
    data: [
      // Task 0: 设计首页原型图
      { taskId: tasks[0].id, userId: user1.id },
      { taskId: tasks[0].id, userId: user2.id },
      // Task 1: 开发用户登录模块
      { taskId: tasks[1].id, userId: user1.id },
      // Task 2: 产品详情页面开发
      { taskId: tasks[2].id, userId: user2.id },
      { taskId: tasks[2].id, userId: user3.id },
      // Task 3: 购物车功能实现
      { taskId: tasks[3].id, userId: user3.id },
      // Task 4: 支付接口对接
      { taskId: tasks[4].id, userId: user1.id },
      // Task 5: APP技术选型
      { taskId: tasks[5].id, userId: user1.id },
      // Task 6: 用户界面设计
      { taskId: tasks[6].id, userId: user2.id },
      // Task 7: 消息推送功能
      { taskId: tasks[7].id, userId: user3.id },
      // Task 8: 离线缓存方案
      { taskId: tasks[8].id, userId: user1.id },
      // Task 9: 权限系统重构
      { taskId: tasks[9].id, userId: user2.id },
      // Task 10: 审批流程优化
      { taskId: tasks[10].id, userId: user1.id },
      // Task 11: 报表导出功能
      { taskId: tasks[11].id, userId: user3.id },
      // Task 12: 数据可视化模块
      { taskId: tasks[12].id, userId: user2.id },
      // Task 13: 数据导出功能
      { taskId: tasks[13].id, userId: user3.id },
      // Task 14: 用户行为分析
      { taskId: tasks[14].id, userId: user1.id },
      { taskId: tasks[14].id, userId: user2.id },
    ],
  })

  console.log('Seed data created successfully!')
  console.log(`- 3 users created`)
  console.log(`- 4 projects created`)
  console.log(`- 9 project members created`)
  console.log(`- 16 task columns created`)
  console.log(`- 15 tasks created`)
  console.log(`- 17 task assignees created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
