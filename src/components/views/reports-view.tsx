'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { TrendingUp, ListChecks, BarChart3, Clock, CheckCircle2 } from 'lucide-react'

interface ProjectStats {
  id: string
  name: string
  progress: number
  status: string
  _count: {
    tasks: number
    members: number
  }
}

interface DashboardStats {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  reviewTasks: number
  tasksByPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
}

const COLORS = ['#ef4444', '#f97316', '#38bdf8', '#94a3b8']
const STATUS_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#ef4444']

export function ReportsView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projects, setProjects] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((res) => res.json()),
      fetch('/api/projects').then((res) => res.json()),
    ])
      .then(([statsData, projectsData]) => {
        setStats(statsData)
        setProjects(projectsData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据报表</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">项目与任务数据分析</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const projectProgressData = projects.map((p) => ({
    name: p.name.length > 6 ? p.name.substring(0, 6) + '...' : p.name,
    progress: p.progress,
    tasks: p._count.tasks,
  }))

  const taskPriorityData = [
    { name: '紧急', value: stats.tasksByPriority.urgent },
    { name: '高', value: stats.tasksByPriority.high },
    { name: '中', value: stats.tasksByPriority.medium },
    { name: '低', value: stats.tasksByPriority.low },
  ]

  const taskStatusData = [
    { name: '已完成', value: stats.completedTasks },
    { name: '进行中', value: stats.inProgressTasks },
    { name: '审核中', value: stats.reviewTasks },
    { name: '待办', value: stats.todoTasks },
  ]

  const trendData = [
    { month: '1月', completed: 2, created: 5 },
    { month: '2月', completed: 4, created: 6 },
    { month: '3月', completed: 3, created: 4 },
    { month: '4月', completed: 5, created: 7 },
    { month: '5月', completed: stats.completedTasks, created: stats.totalTasks },
  ]

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '12px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据报表</h1>
        <p className="text-muted-foreground mt-1 text-[15px]">项目与任务数据分析</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: '总体完成率', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/15 to-emerald-500/5' },
          { title: '总任务数', value: stats.totalTasks, icon: ListChecks, color: 'text-sky-600 dark:text-sky-400', bg: 'from-sky-500/15 to-sky-500/5' },
          { title: '进行中', value: stats.inProgressTasks, icon: BarChart3, color: 'text-violet-600 dark:text-violet-400', bg: 'from-violet-500/15 to-violet-500/5' },
          { title: '待审核', value: stats.reviewTasks, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-500/15 to-amber-500/5' },
        ].map((item) => (
          <Card key={item.title} className="shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 bg-card border-border/40 overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 pl-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">{item.title}</p>
                  <p className={cn('text-[28px] font-bold tracking-tight leading-none mt-1.5 tabular-nums', item.color)}>{item.value}</p>
                </div>
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110', item.bg)}>
                  <item.icon className={cn('h-5 w-5', item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Project progress */}
        <Card className="shadow-card border-border/40 overflow-hidden">
          <div className="h-[2.5px] bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              项目进度概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="progress" name="进度(%)" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task distribution by priority */}
        <Card className="shadow-card border-border/40 overflow-hidden">
          <div className="h-[2.5px] bg-gradient-to-r from-amber-400 to-orange-400" />
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              任务优先级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskPriorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}
                  >
                    {taskPriorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task status distribution */}
        <Card className="shadow-card border-border/40 overflow-hidden">
          <div className="h-[2.5px] bg-gradient-to-r from-sky-400 to-blue-400" />
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              任务状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" name="任务数" radius={[6, 6, 0, 0]}>
                    {taskStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion trend */}
        <Card className="shadow-card border-border/40 overflow-hidden">
          <div className="h-[2.5px] bg-gradient-to-r from-violet-400 to-purple-400" />
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              完成趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="已完成"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="总创建"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
