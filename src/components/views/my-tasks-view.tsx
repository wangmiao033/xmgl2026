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
import { CalendarDays } from 'lucide-react'
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

  // Current user is hardcoded as first user (张三) for demo
  const currentUserId = 'zhangsan-placeholder'

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((res) => res.json()),
      fetch('/api/users').then((res) => res.json()),
    ])
      .then(([projectsData, usersData]) => {
        // Get first user id
        const firstUser = usersData[0]
        if (firstUser) {
          // Collect all tasks that are assigned to this user
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
          // Actually fetch project details for tasks with assignees
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

  // Group by project
  const groupedTasks: Record<string, Task[]> = {}
  filteredTasks.forEach((task) => {
    const key = task.project.name
    if (!groupedTasks[key]) groupedTasks[key] = []
    groupedTasks[key].push(task)
  })

  const statusConfig: Record<string, { label: string; className: string }> = {
    todo: { label: '待办', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    in_progress: { label: '进行中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
    review: { label: '审核中', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    done: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
    high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">我的任务</h1>
        <p className="text-muted-foreground">查看分配给您的所有任务</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
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
          <SelectTrigger className="w-full sm:w-[160px]">
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
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无任务</p>
          <p className="text-sm mt-1">没有找到匹配的任务</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <Card key={projectName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {projectName}
                  <span className="ml-2 text-xs font-normal">({projectTasks.length} 个任务)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {projectTasks.map((task) => {
                    const status = statusConfig[task.status] || statusConfig.todo
                    const priority = priorityConfig[task.priority] || priorityConfig.medium
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              task.priority === 'urgent' && 'bg-red-500',
                              task.priority === 'high' && 'bg-orange-500',
                              task.priority === 'medium' && 'bg-sky-500',
                              task.priority === 'low' && 'bg-slate-400'
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Badge variant="secondary" className={cn('text-[10px]', priority.className)}>
                            {priority.label}
                          </Badge>
                          <Badge variant="secondary" className={cn('text-[10px]', status.className)}>
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
