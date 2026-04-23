'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ExternalLink, Gamepad2 } from 'lucide-react'

interface ProjectMember {
  id: string
  user: { id: string; name: string; avatar?: string | null }
}

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  category?: string
  docUrl?: string | null
  docName?: string | null
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
  active: { label: '进行中', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  paused: { label: '已暂停', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  completed: { label: '已完成', className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' },
  archived: { label: '已归档', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' },
}

const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400', dotColor: 'bg-slate-400' },
  medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400', dotColor: 'bg-sky-500' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400', dotColor: 'bg-orange-500' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', dotColor: 'bg-red-500' },
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active
  const priority = priorityConfig[project.priority] || priorityConfig.medium
  const isGame = project.category === 'game'

  return (
    <Card
      className="cursor-pointer transition-all duration-300 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 bg-card border-border/50 group relative overflow-hidden"
      onClick={onClick}
    >
      {isGame && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
      )}

      <CardHeader className={cn('pb-3', isGame && 'pt-6')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {isGame && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15 shrink-0">
                <Gamepad2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <CardTitle className="text-[15px] font-semibold line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
              {project.name}
            </CardTitle>
          </div>
          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 shrink-0 font-medium', status.className)}>
            {status.label}
          </Badge>
        </div>
        {project.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{project.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', priority.dotColor)} />
            <span className={cn('text-[11px] font-medium', priority.className.split(' ')[1])}>
              {priority.label}优先级
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span className="text-[13px] text-muted-foreground">
            {project.taskCount ?? 0} 个任务
          </span>
          <div className="h-3 w-px bg-border" />
          <span className="text-[13px] text-muted-foreground">
            {project.memberCount ?? 0} 人
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">进度</span>
            <span className="font-semibold tabular-nums">{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                project.progress >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                project.progress >= 50 ? 'bg-gradient-to-r from-sky-400 to-sky-500' :
                'bg-gradient-to-r from-amber-400 to-amber-500'
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {project.docUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(project.docUrl, '_blank')
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200/60 dark:border-emerald-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.docName || '打开在线文档'}</span>
          </button>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex -space-x-2">
            {(project.members || []).slice(0, 4).map((member) => (
              <Avatar key={member.id} className="h-7 w-7 border-2 border-card shadow-sm">
                <AvatarFallback className="text-[11px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {member.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.memberCount && project.memberCount > 4 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground font-medium border-2 border-card">
                +{project.memberCount - 4}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
