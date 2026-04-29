'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/layout/stats-card'
import { ProjectCard } from '@/components/layout/project-card'
import { useAppStore } from '@/stores/app-store'
import { FolderKanban, ListChecks, CheckCircle2, Users, FileText, ExternalLink, ArrowRight, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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
  tasksByPriority: { urgent: number; high: number; medium: number; low: number }
  recentProjects: any[]
  recentTasks: any[]
}

const priorityColors: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#38bdf8', low: '#94a3b8' }
const statusColors: Record<string, string> = { done: '#10b981', in_progress: '#38bdf8', todo: '#94a3b8', review: '#f59e0b' }

const chartTabs = ['本周', '本月', '全部'] as const
type ChartTab = typeof chartTabs[number]

export function DashboardView() {
  const { navigateToProject, setCurrentView } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ChartTab>('全部')
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) { setStats(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-[120px] rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!stats) return <div className="text-center text-muted-foreground py-16">加载统计数据失败</div>

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

  const projectsWithDocs = stats.recentProjects.filter((p: any) => p.docUrl)

  const todayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 lg:p-8 text-white shadow-elevated animate-gradient-shift">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />

        {/* Floating decoration circles */}
        <div className="absolute top-4 right-12 w-20 h-20 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-2 right-48 w-10 h-10 bg-white/8 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-4 right-24 w-14 h-14 bg-white/6 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-2 left-1/3 w-8 h-8 bg-white/10 rounded-full animate-float" style={{ animationDelay: '3.5s' }} />

        {/* Original decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-emerald-200 animate-pulse-soft" />
            <span className="text-emerald-100 text-[14px] font-medium">{todayDate}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{greeting}，张三</h1>
          <p className="text-emerald-100/80 mt-2 text-[15px] max-w-lg">
            当前有 <span className="font-semibold text-white">{stats.activeProjects}</span> 个项目进行中，{stats.inProgressTasks} 个任务待处理，完成率 {stats.completionRate}%
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-[18px] font-semibold">概览数据</h2>
          <div className="h-[2px] w-12 bg-gradient-to-r from-emerald-400 to-transparent rounded-full" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <StatsCard title="总项目数" value={stats.totalProjects} description={`${stats.activeProjects} 个进行中`}
              icon={FolderKanban} iconColor="text-emerald-600 dark:text-emerald-400" iconBg="from-emerald-500/15 to-emerald-500/5" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
            <StatsCard title="进行中任务" value={stats.inProgressTasks} description={`共 ${stats.totalTasks} 个任务`}
              icon={ListChecks} iconColor="text-sky-600 dark:text-sky-400" iconBg="from-sky-500/15 to-sky-500/5" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
            <StatsCard title="已完成任务" value={stats.completedTasks} description={`完成率 ${stats.completionRate}%`}
              icon={CheckCircle2} iconColor="text-teal-600 dark:text-teal-400" iconBg="from-teal-500/15 to-teal-500/5" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '240ms' }}>
            <StatsCard title="团队成员" value={stats.totalUsers} description={`${stats.completedProjects} 个项目已完成`}
              icon={Users} iconColor="text-violet-600 dark:text-violet-400" iconBg="from-violet-500/15 to-violet-500/5" />
          </div>
        </div>
      </div>

      {/* Documents */}
      {projectsWithDocs.length > 0 && (
        <Card className="shadow-card border-border/40 overflow-hidden">
          <div className="h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 shadow-sm">
                <FileText className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-semibold">在线文档</CardTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">快速访问金山文档</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projectsWithDocs.map((project: any) => (
                <a key={project.id} href={project.docUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-4 rounded-xl border border-border/40 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-card-hover hover:-translate-y-0.5 bg-card/80 transition-all duration-300 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{project.docName || project.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">{project.name}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-500 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-5 p-1 bg-muted/60 rounded-lg w-fit">
          {chartTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200',
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="shadow-card border-border/40 overflow-hidden backdrop-blur-sm bg-card/80">
            <div className="h-[2.5px] bg-gradient-to-r from-sky-400 to-sky-500" />
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                任务状态分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskStatusData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' }} />
                    <Bar dataKey="value" name="任务数" radius={[6, 6, 0, 0]}>
                      {taskStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/40 overflow-hidden backdrop-blur-sm bg-card/80">
            <div className="h-[2.5px] bg-gradient-to-r from-amber-400 to-orange-400" />
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                任务优先级分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskPriorityData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}>
                      {taskPriorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-semibold">所有项目</h2>
          <Button variant="ghost" size="sm"
            className="text-[13px] text-muted-foreground hover:text-foreground group/btn transition-all duration-300"
            onClick={() => setCurrentView('projects')}>
            查看全部 <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.recentProjects.map((project: any) => (
            <ProjectCard key={project.id}
              project={{ ...project, taskCount: project._count?.tasks, memberCount: project._count?.members, members: project.members }}
              onClick={() => navigateToProject(project.id)} />
          ))}
        </div>
      </div>

      {/* Recent tasks */}
      <div>
        <h2 className="text-[18px] font-semibold mb-5">最近任务</h2>
        <Card className="shadow-card border-border/40 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {stats.recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent dark:hover:from-emerald-500/5 dark:hover:to-transparent transition-all duration-200 group/task cursor-pointer">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={cn('h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-300',
                      task.priority === 'urgent' && 'bg-red-500 animate-pulse-soft',
                      task.priority === 'high' && 'bg-orange-500',
                      task.priority === 'medium' && 'bg-sky-500',
                      task.priority === 'low' && 'bg-slate-400')} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{task.title}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{task.project?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-4">
                    <Badge variant="secondary" className={cn('text-[11px] px-2.5 py-0.5 font-medium',
                      task.status === 'done' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
                      task.status === 'in_progress' && 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
                      task.status === 'review' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
                      task.status === 'todo' && 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
                    )}>
                      {task.status === 'done' ? '已完成' : task.status === 'in_progress' ? '进行中' : task.status === 'review' ? '审核中' : '待办'}
                    </Badge>
                    {/* Click to navigate visual cue */}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/task:text-muted-foreground/60 transition-all duration-200 group-hover/task:translate-x-0.5" />
                    {task.assignees?.length > 0 && (
                      <div className="flex -space-x-1.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                        {task.assignees.slice(0, 2).map((a: any) => (
                          <div key={a.id} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium border-2 border-card shadow-sm">
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
