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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">数据报表</h1>
          <p className="text-muted-foreground">项目与任务数据分析</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
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

  // Simulated completion trend data
  const trendData = [
    { month: '1月', completed: 2, created: 5 },
    { month: '2月', completed: 4, created: 6 },
    { month: '3月', completed: 3, created: 4 },
    { month: '4月', completed: 5, created: 7 },
    { month: '5月', completed: stats.completedTasks, created: stats.totalTasks },
  ]

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据报表</h1>
        <p className="text-muted-foreground">项目与任务数据分析</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">总体完成率</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalTasks}</p>
            <p className="text-xs text-muted-foreground">总任务数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-sky-600">{stats.inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">进行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.reviewTasks}</p>
            <p className="text-xs text-muted-foreground">待审核</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">项目进度概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="progress" name="进度(%)" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task distribution by priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">任务优先级分布</CardTitle>
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

        {/* Task status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">任务状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">完成趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
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
