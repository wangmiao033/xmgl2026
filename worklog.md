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

---
Task ID: 2
Agent: main
Task: 优化项目管理网站 - 多项功能增强（8项优化）

Work Log:
- 读取并分析现有代码结构（worklog + 10个关键文件）
- 优化1：实现看板任务拖拽功能 - 使用 @dnd-kit/core 的 DndContext + useDraggable + useDroppable 实现跨列拖拽，包含 DragOverlay 视觉反馈和列高亮效果
- 优化2：创建 edit-task-dialog.tsx 编辑任务弹窗 - 模仿 create-task-dialog 结构，支持编辑标题、描述、优先级、状态列、截止日期、指派成员
- 优化2：更新 project-detail-view.tsx - 点击任务卡片打开编辑弹窗，悬停显示编辑/删除图标
- 优化3：全面添加 Toast 通知 - 项目创建成功、任务创建/更新/删除成功、任务拖拽移动、项目编辑/删除、成员添加、设置保存
- 优化4：看板列增强 - 每列显示彩色任务计数徽章、列底显示任务汇总（x / 总数）、列添加按钮样式优化、不同列使用不同背景色
- 优化5：仪表板布局改进 - 统计卡片添加彩色左边框（emerald/sky/teal/violet）、文档快捷入口更紧凑（2列手机/3列桌面）、所有项目可滚动查看 + 查看全部链接
- 优化6：团队视图增强 - 添加"添加成员"按钮和弹窗（姓名/邮箱/角色）、显示已完成任务数和参与项目数
- 优化6：更新 /api/users 路由 - 新增 POST 处理创建用户、GET 增强（包含 completedTasks 和 projectCount）
- 优化7：设置页面增强 - localStorage 持久化保存、保存按钮、数据管理区域（导出JSON/重置数据+确认弹窗）、关于系统信息
- 优化8：侧边栏搜索 - 顶部搜索框（暗色主题适配）、实时搜索项目和任务、下拉结果展示、点击导航到项目详情
- 更新 /api/tasks/[id] PUT 路由 - 支持 assigneeIds 更新（删除旧指派+创建新指派）
- 更新 create-project-dialog.tsx - 创建成功时显示 Toast
- 更新 stats-card.tsx - 新增 borderColor、iconColor、iconBg props 支持彩色边框
- 运行 lint 检查通过（修复 react-hooks/set-state-in-effect 规则问题）
- 开发服务器正常运行，所有 API 返回 200

Stage Summary:
- 新建文件：edit-task-dialog.tsx
- 重写文件：project-detail-view.tsx、dashboard-view.tsx、team-view.tsx、settings-view.tsx、app-sidebar.tsx、stats-card.tsx、create-project-dialog.tsx
- 更新 API 路由：/api/tasks/[id]（支持 assigneeIds）、/api/users（新增 POST + 增强 GET）
- 8项优化全部完成，lint 通过，无运行时错误
- 全部 UI 文本为中文
