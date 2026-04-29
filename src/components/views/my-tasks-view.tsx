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

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'review', label: '审核中' },
  { value: 'done', label: '已完成' },
]

const priorityFilters = [
  { value: 'all', label: '全部' },
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

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
    todo: { label: '待办', className: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-600 dark:from-slate-500/10 dark:to-slate-500/20 dark:text-slate-300', icon: Circle },
    in_progress: { label: '进行中', className: 'bg-gradient-to-r from-sky-50 to-sky-100/80 text-sky-700 dark:from-sky-500/10 dark:to-sky-500/20 dark:text-sky-400', icon: Clock },
    review: { label: '审核中', className: 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 dark:from-amber-500/10 dark:to-amber-500/20 dark:text-amber-400', icon: AlertCircle },
    done: { label: '已完成', className: 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 dark:from-emerald-500/10 dark:to-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: '低', className: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-600 dark:from-slate-500/10 dark:to-slate-500/20 dark:text-slate-300' },
    medium: { label: '中', className: 'bg-gradient-to-r from-sky-50 to-sky-100/80 text-sky-700 dark:from-sky-500/10 dark:to-sky-500/20 dark:text-sky-400' },
    high: { label: '高', className: 'bg-gradient-to-r from-orange-50 to-orange-100/80 text-orange-700 dark:from-orange-500/10 dark:to-orange-500/20 dark:text-orange-400' },
    urgent: { label: '紧急', className: 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 dark:from-red-500/10 dark:to-red-500/20 dark:text-red-400' },
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

      {/* Enhanced Filter Bar with glass effect */}
      <div className="p-3.5 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30 shadow-card">
        {/* Tab-style status filter with animated underline */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-0.5">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'relative px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap',
                statusFilter === filter.value
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {filter.label}
              {statusFilter === filter.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-muted-foreground mr-1">优先级:</span>
          {priorityFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setPriorityFilter(filter.value)}
              className={cn(
                'px-2.5 py-1 text-[12px] font-medium rounded-md transition-all whitespace-nowrap',
                priorityFilter === filter.value
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
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
            <Card key={projectName} className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400" />
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-[14px] font-semibold text-muted-foreground flex items-center gap-2">
                  {projectName}
                  <span className="text-[12px] font-normal bg-muted/80 px-2 py-0.5 rounded-full">{projectTasks.length} 个任务</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/20">
                  {projectTasks.map((task) => {
                    const status = statusConfig[task.status] || statusConfig.todo
                    const priority = priorityConfig[task.priority] || priorityConfig.medium
                    const StatusIcon = status.icon
                    const isDone = task.status === 'done'
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent',
                          isDone && 'opacity-60',
                          isOverdue && 'border-l-2 border-l-red-400/60'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'transition-transform duration-200',
                            isDone && 'text-emerald-500'
                          )}>
                            <StatusIcon className={cn('h-4 w-4 shrink-0', isDone ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn('text-[14px] font-medium truncate', isDone && 'line-through')}>{task.title}</p>
                            {task.dueDate && (
                              <div className={cn(
                                'flex items-center gap-1 text-[12px] mt-0.5',
                                isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                              )}>
                                <CalendarDays className={cn('h-3 w-3', isOverdue && 'text-red-400')} />
                                {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                                {isOverdue && ' (已逾期)'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium rounded-lg', priority.className)}>
                            {priority.label}
                          </Badge>
                          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium rounded-lg', status.className)}>
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
