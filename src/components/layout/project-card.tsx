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
  showMeta?: boolean
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  active: { label: '进行中', className: 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 dark:from-emerald-500/10 dark:to-emerald-500/20 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  paused: { label: '已暂停', className: 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 dark:from-amber-500/10 dark:to-amber-500/20 dark:text-amber-400', dotColor: 'bg-amber-500' },
  completed: { label: '已完成', className: 'bg-gradient-to-r from-teal-50 to-teal-100/80 text-teal-700 dark:from-teal-500/10 dark:to-teal-500/20 dark:text-teal-400', dotColor: 'bg-teal-500' },
  archived: { label: '已归档', className: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-600 dark:from-slate-500/10 dark:to-slate-500/20 dark:text-slate-400', dotColor: 'bg-slate-400' },
}

const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  low: { label: '低', className: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-600 dark:from-slate-500/10 dark:to-slate-500/20 dark:text-slate-400', dotColor: 'bg-slate-400' },
  medium: { label: '中', className: 'bg-gradient-to-r from-sky-50 to-sky-100/80 text-sky-700 dark:from-sky-500/10 dark:to-sky-500/20 dark:text-sky-400', dotColor: 'bg-sky-500' },
  high: { label: '高', className: 'bg-gradient-to-r from-orange-50 to-orange-100/80 text-orange-700 dark:from-orange-500/10 dark:to-orange-500/20 dark:text-orange-400', dotColor: 'bg-orange-500' },
  urgent: { label: '紧急', className: 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 dark:from-red-500/10 dark:to-red-500/20 dark:text-red-400', dotColor: 'bg-red-500' },
}

export function ProjectCard({ project, onClick, showMeta = true }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active
  const priority = priorityConfig[project.priority] || priorityConfig.medium
  const isGame = project.category === 'game'

  return (
    <Card
      className="cursor-pointer transition-all duration-300 shadow-card hover:shadow-glass-hover hover:-translate-y-1.5 bg-card/80 backdrop-blur-sm border-border/30 group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {isGame && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
      )}

      {/* Priority indicator dot - enhanced with glow for urgent/high */}
      <div className="absolute top-4 right-4">
        <div className={cn(
          'h-2.5 w-2.5 rounded-full',
          priority.dotColor,
          project.priority === 'urgent' && 'shadow-[0_0_6px_rgba(239,68,68,0.4)] animate-pulse-soft',
          project.priority === 'high' && 'shadow-[0_0_6px_rgba(249,115,22,0.3)]'
        )} />
      </div>

      <CardHeader className={cn('pb-3 relative', isGame && 'pt-6')}>
        <div className="flex items-center gap-2.5 min-w-0 pr-6">
          {isGame && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 shrink-0 shadow-sm">
              <Gamepad2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <CardTitle className="text-[15px] font-semibold line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            {project.name}
          </CardTitle>
        </div>
        {project.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{project.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4 relative">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium rounded-lg', status.className)}>
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full mr-1.5', status.dotColor)} />
            {status.label}
          </Badge>
          <div className="h-3 w-px bg-border/60" />
          <span className="text-[12px] font-medium text-muted-foreground">
            {priority.label}优先级
          </span>
        </div>

        {showMeta && (
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <span>{project.taskCount ?? 0} 个任务</span>
            <span>{project.memberCount ?? 0} 人</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">进度</span>
            <span className="font-semibold tabular-nums">{project.progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden',
                project.progress >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                project.progress >= 50 ? 'bg-gradient-to-r from-sky-400 to-sky-500' :
                project.progress >= 25 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-red-300 to-red-400'
              )}
              style={{ width: `${project.progress}%` }}
            >
              {/* Shimmer effect on progress bar fill */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        </div>

        {project.docUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(project.docUrl!, '_blank')
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-emerald-50/80 backdrop-blur-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:-translate-y-0.5 hover:shadow-sm transition-all border border-emerald-200/60 dark:border-emerald-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span className="truncate">{project.docName || '打开在线文档'}</span>
          </button>
        )}

        {showMeta && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex -space-x-2">
              {(project.members || []).slice(0, 4).map((member) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-card shadow-sm ring-1 ring-border/20">
                  <AvatarFallback className="text-[11px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {member.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.memberCount && project.memberCount > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/80 text-[11px] text-muted-foreground font-medium border-2 border-card ring-1 ring-border/20 shadow-sm">
                  +{project.memberCount - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
