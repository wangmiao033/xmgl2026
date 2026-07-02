'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from '@/components/layout/project-card'
import { useAppStore } from '@/stores/app-store'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  Gauge,
  PauseCircle,
  Sparkles,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  recentProjects: ProjectSummary[]
}

interface ProjectSummary {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  category?: string
  docUrl?: string | null
  docName?: string | null
  progress: number
  _count?: {
    tasks: number
    members: number
  }
  members?: any[]
}

interface DashboardViewProps {
  currentUser?: {
    name: string
  } | null
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: '推进中', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: Target },
  paused: { label: '暂停', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: PauseCircle },
  completed: { label: '完成', className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400', icon: CheckCircle2 },
  archived: { label: '归档', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', icon: FolderKanban },
}

const priorityConfig: Record<string, { label: string; className: string; bar: string }> = {
  urgent: { label: '紧急', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', bar: 'bg-red-500' },
  high: { label: '高', className: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', bar: 'bg-orange-500' },
  medium: { label: '中', className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400', bar: 'bg-sky-500' },
  low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', bar: 'bg-slate-400' },
}

export function DashboardView({ currentUser }: DashboardViewProps) {
  const { navigateToProject, setCurrentView } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-[156px] rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!stats) return <div className="text-center text-muted-foreground py-16">加载项目管理数据失败</div>

  const projects = stats.recentProjects || []
  const activeProjects = projects.filter((project) => project.status === 'active')
  const riskProjects = projects.filter((project) => project.priority === 'urgent' || project.priority === 'high')
  const docs = projects.filter((project) => project.docUrl)
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + (project.progress || 0), 0) / projects.length)
    : 0
  const leadProject = [...projects].sort((a, b) => (b.progress || 0) - (a.progress || 0))[0]
  const displayName = currentUser?.name?.trim() || '同事'
  const todayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-[linear-gradient(135deg,#064e3b_0%,#059669_48%,#0f766e_100%)] p-6 text-white shadow-elevated lg:p-7">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-12 h-24 w-24 rounded-full bg-cyan-200/10 blur-xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-emerald-50/90">
              <Sparkles className="h-4 w-4" />
              <span>{todayDate}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">项目管理工作台</h1>
            <p className="mt-2 text-[14px] leading-6 text-emerald-50/85">
              {displayName}，这里集中查看项目进度、优先级、文档和需要关注的项目，不再用零散任务和人员数字干扰判断。
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-3 gap-2 rounded-xl border border-white/15 bg-white/10 p-2 backdrop-blur">
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">项目总数</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{stats.totalProjects}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">推进中</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{stats.activeProjects}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">平均进度</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{averageProgress}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <Card className="overflow-hidden border-border/40 bg-card/85 shadow-card">
          <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-[16px]">项目管理区域</CardTitle>
              <p className="mt-1 text-[12px] text-muted-foreground">按进度查看当前项目推进状态</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]" onClick={() => setCurrentView('projects')}>
              项目列表
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.map((project) => {
              const status = statusConfig[project.status] || statusConfig.active
              const priority = priorityConfig[project.priority] || priorityConfig.medium
              const StatusIcon = status.icon

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigateToProject(project.id)}
                  className="group w-full rounded-xl border border-border/40 bg-background/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-card-hover dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 text-emerald-500" />
                        <p className="truncate text-[14px] font-semibold">{project.name}</p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{project.description || project.docName || '项目资料待补充'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn('rounded-lg px-2 py-0.5 text-[11px]', status.className)}>{status.label}</Badge>
                      <Badge variant="secondary" className={cn('rounded-lg px-2 py-0.5 text-[11px]', priority.className)}>{priority.label}优先级</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_72px] sm:items-center">
                    <Progress value={project.progress || 0} className="h-2" />
                    <span className="text-right text-[12px] font-semibold tabular-nums text-muted-foreground">{project.progress || 0}%</span>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/40 bg-card/85 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Gauge className="h-4 w-4 text-emerald-500" />
                进度焦点
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadProject ? (
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-[12px] text-emerald-700/70 dark:text-emerald-300/70">当前进度最高</p>
                  <p className="mt-1 text-[16px] font-semibold text-emerald-950 dark:text-emerald-50">{leadProject.name}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={leadProject.progress || 0} className="h-2" />
                    <span className="text-[13px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{leadProject.progress || 0}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">暂无项目进度数据</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/85 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                优先级关注
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {riskProjects.length > 0 ? riskProjects.map((project) => {
                const priority = priorityConfig[project.priority] || priorityConfig.medium
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigateToProject(project.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{project.name}</p>
                      <p className="text-[11px] text-muted-foreground">进度 {project.progress || 0}%</p>
                    </div>
                    <span className={cn('h-2 w-2 rounded-full', priority.bar)} />
                  </button>
                )
              }) : (
                <p className="text-[13px] text-muted-foreground">暂无高优先级项目</p>
              )}
            </CardContent>
          </Card>

          {docs.length > 0 && (
            <Card className="border-border/40 bg-card/85 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <FileText className="h-4 w-4 text-sky-500" />
                  项目文档
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docs.slice(0, 4).map((project) => (
                  <a
                    key={project.id}
                    href={project.docUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-[13px] transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate">{project.docName || project.name}</span>
                    <ExternalLink className="ml-3 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold">项目矩阵</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">从项目卡片直接进入详情和在线文档</p>
          </div>
          <Button variant="ghost" size="sm" className="text-[13px]" onClick={() => setCurrentView('projects')}>
            查看全部
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{ ...project, taskCount: project._count?.tasks, memberCount: project._count?.members, members: project.members }}
              showMeta={false}
              onClick={() => navigateToProject(project.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
