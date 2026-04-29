'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CalendarDays, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskAssignee {
  id: string
  user: { id: string; name: string; avatar?: string | null }
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

const priorityConfig: Record<string, { label: string; className: string; barColor: string }> = {
  low: { label: '低', className: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-600 dark:from-slate-500/10 dark:to-slate-500/20 dark:text-slate-400', barColor: 'bg-slate-300 dark:bg-slate-600' },
  medium: { label: '中', className: 'bg-gradient-to-r from-sky-50 to-sky-100/80 text-sky-700 dark:from-sky-500/10 dark:to-sky-500/20 dark:text-sky-400', barColor: 'bg-sky-400 dark:bg-sky-500' },
  high: { label: '高', className: 'bg-gradient-to-r from-orange-50 to-orange-100/80 text-orange-700 dark:from-orange-500/10 dark:to-orange-500/20 dark:text-orange-400', barColor: 'bg-orange-400 dark:bg-orange-500' },
  urgent: { label: '紧急', className: 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 dark:from-red-500/10 dark:to-red-500/20 dark:text-red-400', barColor: 'bg-red-400 dark:bg-red-500' },
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  const isUrgent = task.priority === 'urgent'

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 shadow-card hover:shadow-glass-hover hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm border-border/30 shadow-inner-glow',
        onClick && 'hover:border-primary/30'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        {/* Priority color bar + Title row */}
        <div className="flex items-start gap-2.5">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-1 shrink-0 cursor-grab active:cursor-grabbing" />
          <div className={cn(
            'w-[3px] self-stretch rounded-full shrink-0',
            priority.barColor,
            isUrgent && 'shadow-[0_0_6px_rgba(239,68,68,0.4)]'
          )} />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[13px] font-medium leading-snug line-clamp-2 tracking-wide">{task.title}</h4>
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 shrink-0 font-medium rounded-lg', priority.className)}>
                {priority.label}
              </Badge>
            </div>
            {task.description && (
              <p className="text-[12px] text-muted-foreground line-clamp-1 leading-relaxed">{task.description}</p>
            )}
          </div>
        </div>

        {/* Footer: assignees + due date */}
        <div className="flex items-center justify-between mt-3 pl-7">
          <div className="flex items-center gap-1.5">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <Avatar key={assignee.id} className="h-5 w-5 border border-card shadow-sm ring-1 ring-border/20">
                    <AvatarFallback className="text-[9px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-muted-foreground font-medium">
                      {assignee.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <span className="text-[11px] text-muted-foreground ml-1 font-medium">+{task.assignees.length - 3}</span>
                )}
              </div>
            )}
          </div>
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] tabular-nums',
              isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
            )}>
              <CalendarDays className={cn('h-3 w-3', isOverdue && 'text-red-400')} />
              <span>
                {new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
