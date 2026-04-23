'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/layout/stats-card'
import { ProjectCard } from '@/components/layout/project-card'
import { useAppStore } from '@/stores/app-store'
import { FolderKanban, ListChecks, CheckCircle2, Users, FileText, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalProjects: number
  totalUsers: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  reviewTasks: number
  activeProjects: number
  completedProjects: number
  completionRate: number
  tasksByPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  recentProjects: any[]
  recentTasks: any[]
}

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#38bdf8',
  low: '#94a3b8',
}

const statusColors: Record<string, string> = {
  done: '#10b981',
  in_progress: '#38bdf8',
  todo: '#94a3b8',
  review: '#f59e0b',
}

export function DashboardView() {
  const { navigateToProject, setCurrentView } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">仪表板</h1>
          <p className="text-muted-foreground">项目概览与数据分析</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-12">加载统计数据失败</div>
  }

  const taskStatusData = [
    { name: '待办', value: stats.todoTasks, color: statusColors.todo },
    { name: '进行中', value: stats.inProgressTasks, color: statusColors.in_progress },
    { name: '审核中', value: stats.reviewTasks, color: statusColors.review },
    { name: '已完成', value: stats.completedTasks, color: statusColors.done },
  ]

  const taskPriorityData = [
    { name: '紧急', value: stats.tasksByPriority.urgent, fill: priorityColors.urgent },
    { name: '高', value: stats.tasksByPriority.high, fill: priorityColors.high },
    { name: '中', value: stats.tasksByPriority.medium, fill: priorityColors.medium },
    { name: '低', value: stats.tasksByPriority.low, fill: priorityColors.low },
  ]

  // Projects with document links
  const projectsWithDocs = stats.recentProjects.filter((p: any) => p.docUrl)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表板</h1>
        <p className="text-muted-foreground">项目概览与数据分析</p>
      </div>

      {/* Stats cards with colored left borders */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="总项目数"
          value={stats.totalProjects}
          description={`${stats.activeProjects} 个进行中`}
          icon={FolderKanban}
          borderColor="border-l-emerald-500"
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatsCard
          title="进行中任务"
          value={stats.inProgressTasks}
          description={`共 ${stats.totalTasks} 个任务`}
          icon={ListChecks}
          borderColor="border-l-sky-500"
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-900/20"
        />
        <StatsCard
          title="已完成任务"
          value={stats.completedTasks}
          description={`完成率 ${stats.completionRate}%`}
          icon={CheckCircle2}
          borderColor="border-l-teal-500"
          iconColor="text-teal-600 dark:text-teal-400"
          iconBg="bg-teal-50 dark:bg-teal-900/20"
        />
        <StatsCard
          title="团队成员"
          value={stats.totalUsers}
          description={`${stats.completedProjects} 个项目已完成`}
          icon={Users}
          borderColor="border-l-violet-500"
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
        />
      </div>

      {/* Quick document access - compact */}
      {projectsWithDocs.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base">在线文档快捷入口</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {projectsWithDocs.map((project: any) => (
                <a
                  key={project.id}
                  href={project.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {project.docName || project.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{project.name}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-emerald-500 shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">任务状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" name="任务数" radius={[4, 4, 0, 0]}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">任务优先级分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskPriorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}
                  >
                    {taskPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent projects - all projects in scrollable grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最近项目</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            onClick={() => setCurrentView('projects')}
          >
            查看全部
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="max-h-[500px] overflow-y-auto rounded-lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentProjects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={{
                  ...project,
                  taskCount: project._count?.tasks,
                  memberCount: project._count?.members,
                  members: project.members,
                }}
                onClick={() => navigateToProject(project.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">最近任务</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.recentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      task.priority === 'urgent' && 'bg-red-500',
                      task.priority === 'high' && 'bg-orange-500',
                      task.priority === 'medium' && 'bg-sky-500',
                      task.priority === 'low' && 'bg-slate-400',
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px]',
                        task.status === 'done' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                        task.status === 'in_progress' && 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
                        task.status === 'review' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                        task.status === 'todo' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {task.status === 'done' ? '已完成' : task.status === 'in_progress' ? '进行中' : task.status === 'review' ? '审核中' : '待办'}
                    </Badge>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex -space-x-1">
                        {task.assignees.slice(0, 2).map((a: any) => (
                          <div key={a.id} className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[8px] text-emerald-700 dark:text-emerald-400 border border-background">
                            {a.user.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
