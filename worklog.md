# Work Log - 企业内部项目管理系统

## Date: 2026-04-23

## Summary
Built a comprehensive company internal project management website from scratch using Next.js 16 with App Router, TypeScript, Tailwind CSS 4, and shadcn/ui. The application features a sidebar navigation layout with 8 distinct views, all implemented within the single `/` route using Zustand for client-side state management.

## What was built

### Database Schema (Prisma/SQLite)
- **6 models**: User, Project, ProjectMember, TaskColumn, Task, TaskAssignee
- Full relational schema with proper indexes and cascade delete rules
- Schema pushed and seeded with demo data (3 users, 4 projects, 15 tasks, 16 columns)

### API Routes (10 endpoints)
- `GET /api/projects` - List all projects with task/member counts
- `POST /api/projects` - Create new project (with default task columns)
- `GET /api/projects/[id]` - Project detail with columns, tasks, members
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/tasks` - Create task with assignees
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `GET /api/users` - List all users
- `GET /api/dashboard/stats` - Dashboard statistics

### Views (8 views)
1. **仪表板 (Dashboard)** - Stats cards, task status/priority charts, recent projects/tasks
2. **项目列表 (Projects)** - Searchable/filterable project grid with create dialog
3. **项目详情 (Project Detail)** - Kanban board with 4 columns, task CRUD, delete project
4. **团队管理 (Team)** - Team member cards with role badges and task counts
5. **我的任务 (My Tasks)** - Tasks grouped by project with status/priority filters
6. **任务日历 (Calendar)** - Monthly calendar view showing tasks by due date
7. **数据报表 (Reports)** - Charts for project progress, task distribution, trends
8. **系统设置 (Settings)** - Company info, notification preferences, theme toggle

### Layout Components (7 components)
- `AppSidebar` - Dark sidebar with navigation, logo, user profile
- `AppHeader` - Breadcrumb navigation with sidebar trigger
- `CreateProjectDialog` - Project creation form with validation
- `CreateTaskDialog` - Task creation with column selection and assignee picking
- `TaskCard` - Kanban task card with priority badge, assignees, due date
- `ProjectCard` - Project card with progress bar, status, member avatars
- `StatsCard` - Reusable statistics card

### Architecture
- **Zustand store** (`src/stores/app-store.ts`) for view navigation state
- **View switching** via client-side state (single `/` route)
- **ThemeProvider** via `next-themes` for dark mode support
- **Responsive design** with mobile sidebar (Sheet component)

## Files Created
```
prisma/schema.prisma (updated)
prisma/seed.ts
src/stores/app-store.ts
src/app/layout.tsx (updated)
src/app/page.tsx (rewritten)
src/app/api/projects/route.ts
src/app/api/projects/[id]/route.ts
src/app/api/projects/[id]/tasks/route.ts
src/app/api/tasks/[id]/route.ts
src/app/api/users/route.ts
src/app/api/dashboard/stats/route.ts
src/components/layout/app-sidebar.tsx
src/components/layout/app-header.tsx
src/components/layout/create-project-dialog.tsx
src/components/layout/create-task-dialog.tsx
src/components/layout/task-card.tsx
src/components/layout/project-card.tsx
src/components/layout/stats-card.tsx
src/components/views/dashboard-view.tsx
src/components/views/projects-view.tsx
src/components/views/project-detail-view.tsx
src/components/views/team-view.tsx
src/components/views/settings-view.tsx
src/components/views/my-tasks-view.tsx
src/components/views/calendar-view.tsx
src/components/views/reports-view.tsx
```

## Issues Encountered
- **React 19 lint rule**: `react-hooks/set-state-in-effect` flagged synchronous `setState` calls inside `useEffect`. Fixed by inlining fetch calls with proper cleanup flags instead of wrapper functions.
- No other issues - build compiles successfully, no runtime errors in dev log.

## Design Decisions
- Emerald/teal accent color palette (no indigo/blue)
- Dark sidebar (`bg-slate-900`) with light text
- All UI text in Chinese
- Recharts for data visualization
- Priority color system: red(urgent), orange(high), sky(medium), slate(low)
- Status color system: emerald(active), amber(paused), teal(completed), gray(archived)
