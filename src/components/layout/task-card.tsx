'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CalendarDays, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskAssignee {
  id: string
  user: {
    id: string
    name: string
    avatar?: string | null
  }
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate?: string | null
  assignees?: TaskAssignee[]
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md border border-border/50 bg-card',
        onClick && 'hover:border-emerald-300 dark:hover:border-emerald-700'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium truncate">{task.title}</h4>
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 shrink-0', priority.className)}>
                {priority.label}
              </Badge>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                    <AvatarFallback className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {assignee.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
