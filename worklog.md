---
Task ID: 1
Agent: main
Task: 优化项目管理网站 - 添加WPS在线文档链接支持

Work Log:
- 分析现有项目代码结构，制定优化方案
- 更新 Prisma Schema：Project 模型增加 docUrl、docName、category 三个字段
- 运行 db:push 同步数据库结构
- 重写种子数据，替换为用户提供的 5 个真实游戏项目（含 WPS 文档链接）
- 更新 API 路由：POST /api/projects 和 PUT /api/projects/[id] 支持新字段
- 重写 project-card.tsx：游戏项目显示彩色顶部条 + Gamepad2 图标 + 文档链接按钮
- 重写 create-project-dialog.tsx：新增「在线文档链接」区域（文档名称+URL），默认类型为"游戏项目"
- 新建 edit-project-dialog.tsx：支持编辑项目所有字段（状态、进度、文档链接等）
- 重写 project-detail-view.tsx：文档链接以醒目的绿色虚线卡片展示 + 编辑按钮
- 重写 dashboard-view.tsx：新增「在线文档快捷入口」卡片区域
- 重写 projects-view.tsx：新增分类筛选（游戏/工具/网站/其他）
- 重写 app-sidebar.tsx：侧边栏底部展示项目快捷入口，有文档的直接跳转
- 运行 lint 检查通过，开发服务器正常运行

Stage Summary:
- 数据库新增 3 个字段：docUrl、docName、category
- 种子数据包含 5 个游戏项目 + 24 个任务 + WPS 文档链接
- 前端全面升级：项目卡片、新建/编辑弹窗、详情页、仪表板、侧边栏均支持文档链接
- 所有 UI 文本为中文
