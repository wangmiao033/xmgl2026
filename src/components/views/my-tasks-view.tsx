'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskAssignee {
  id: string
  user: {
    id: string
    name: string
  }
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate?: string | null
  project: {
    name: string
  }
  assignees: TaskAssignee[]
}

interface User {
  id: string
  name: string
}

export function MyTasksView() {
  const { navigateToProject } = useAppStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const currentUserId = 'zhangsan-placeholder'

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((res) => res.json()),
      fetch('/api/users').then((res) => res.json()),
    ])
      .then(([projectsData, usersData]) => {
        const firstUser = usersData[0]
        if (firstUser) {
          const allTasks: Task[] = []
          projectsData.forEach((project: any) => {
            project.tasks?.forEach((task: any) => {
              const isAssigned = task.assignees?.some(
                (a: any) => a.userId === firstUser.id
              )
              if (isAssigned) {
                allTasks.push({
                  ...task,
                  project: { name: project.name },
                })
              }
            })
          })
          const tasksWithAssignees = allTasks.filter((t) => t.assignees?.length)
          setTasks(tasksWithAssignees)
          setUsers(usersData)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesStatus && matchesPriority
  })

  const groupedTasks: Record<string, Task[]> = {}
  filteredTasks.forEach((task) => {
    const key = task.project.name
    if (!groupedTasks[key]) groupedTasks[key] = []
    groupedTasks[key].push(task)
  })

  const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    todo: { label: '待办', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: Circle },
    in_progress: { label: '进行中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Clock },
    review: { label: '审核中', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
    done: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
    high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }

  const totalTasks = filteredTasks.length
  const doneTasks = filteredTasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的任务</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            查看分配给您的所有任务
            {totalTasks > 0 && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                已完成 {doneTasks}/{totalTasks}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row p-3.5 rounded-xl bg-card/80 border border-border/40 shadow-card">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background/80 border-border/50">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="todo">待办</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="review">审核中</SelectItem>
            <SelectItem value="done">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background/80 border-border/50">
            <SelectValue placeholder="优先级筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            <SelectItem value="urgent">紧急</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-[16px] font-semibold">暂无任务</p>
          <p className="text-[14px] text-muted-foreground mt-1.5">没有找到匹配的任务</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedTasks).map(([projectName, projectTasks], index) => (
            <Card key={projectName} className="shadow-card border-border/40 overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400" />
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-[14px] font-semibold text-muted-foreground flex items-center gap-2">
                  {projectName}
                  <span className="text-[12px] font-normal bg-muted px-2 py-0.5 rounded-full">{projectTasks.length} 个任务</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {projectTasks.map((task) => {
                    const status = statusConfig[task.status] || statusConfig.todo
                    const priority = priorityConfig[task.priority] || priorityConfig.medium
                    const StatusIcon = status.icon
                    const isDone = task.status === 'done'
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors',
                          isDone && 'opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusIcon className={cn('h-4 w-4 shrink-0', isDone ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                          <div className="min-w-0">
                            <p className={cn('text-[14px] font-medium truncate', isDone && 'line-through')}>{task.title}</p>
                            {task.dueDate && (
                              <div className={cn(
                                'flex items-center gap-1 text-[12px] mt-0.5',
                                new Date(task.dueDate) < new Date() && !isDone ? 'text-red-500 font-medium' : 'text-muted-foreground'
                              )}>
                                <CalendarDays className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                                {new Date(task.dueDate) < new Date() && !isDone && ' (已逾期)'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium', priority.className)}>
                            {priority.label}
                          </Badge>
                          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium', status.className)}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
