'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProjectMember {
  id: string
  user: {
    id: string
    name: string
    avatar?: string | null
  }
}

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  progress: number
  taskCount?: number
  memberCount?: number
  members?: ProjectMember[]
}

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '进行中', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  paused: { label: '已暂停', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: '已完成', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  archived: { label: '已归档', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active
  const priority = priorityConfig[project.priority] || priorityConfig.medium

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {project.name}
          </CardTitle>
          <Badge variant="secondary" className={cn('text-[10px] shrink-0', status.className)}>
            {status.label}
          </Badge>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px]', priority.className)}>
            {priority.label}优先级
          </Badge>
          <span className="text-xs text-muted-foreground">
            {project.taskCount ?? 0} 个任务
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">进度</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(project.members || []).slice(0, 4).map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {member.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.memberCount && project.memberCount > 4 && (
              <span className="text-[10px] text-muted-foreground ml-1.5">
                +{project.memberCount - 4}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {project.memberCount ?? 0} 名成员
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
