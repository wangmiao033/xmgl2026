'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreateProjectDialog } from '@/components/layout/create-project-dialog'
import { useAppStore } from '@/stores/app-store'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  FolderKanban,
  Gamepad2,
  Search,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProjectChannel {
  id: string
  paramsStatus: string
  packageStatus: string
  testingStatus: string
  reviewStatus: string
  launchStatus: string
}

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  category: string
  gameType?: string | null
  partnerCompany?: string | null
  cooperationMode?: string | null
  launchDate?: string | null
  startDate?: string | null
  channels?: ProjectChannel[]
  _count?: {
    tasks: number
    members: number
    channels?: number
    files?: number
  }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '接入中', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  paused: { label: '暂停', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  completed: { label: '已完成', className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  archived: { label: '已归档', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' },
}

const statusWeight: Record<string, number> = {
  pending: 0,
  processing: 0.5,
  submitted: 0.5,
  reviewing: 0.5,
  scheduled: 0.5,
  done: 1,
  passed: 1,
  online: 1,
  failed: 0,
  rejected: 0,
}

function getChannelProgress(channels: ProjectChannel[] = []) {
  if (!channels.length) return 0
  const total = channels.reduce((sum, channel) => {
    const steps = [
      channel.paramsStatus,
      channel.packageStatus,
      channel.testingStatus,
      channel.reviewStatus,
      channel.launchStatus,
    ]
    return sum + steps.reduce((stepSum, value) => stepSum + (statusWeight[value] ?? 0), 0) / steps.length
  }, 0)
  return Math.round((total / channels.length) * 100)
}

export function ProjectsView() {
  const { navigateToProject } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
      project.name,
      project.gameType,
      project.partnerCompany,
      project.cooperationMode,
    ].some((value) => value?.toLowerCase().includes(query))
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  }), [projects, search, statusFilter])

  const activeCount = projects.filter((project) => project.status === 'active').length
  const onlineProjects = projects.filter((project) => (project.channels || []).some((channel) => channel.launchStatus === 'online')).length
  const totalChannels = projects.reduce((sum, project) => sum + (project.channels?.length || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">游戏项目</h1>
          </div>
          <p className="mt-1 text-[14px] text-muted-foreground">一个游戏一个项目，渠道接入和资料都收在项目里面。</p>
        </div>
        <CreateProjectDialog onCreated={() => setRefreshKey((key) => key + 1)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="全部项目" value={projects.length} icon={FolderKanban} />
        <SummaryCard label="接入中" value={activeCount} icon={Radio} />
        <SummaryCard label="已维护渠道" value={totalChannels} suffix={` · ${onlineProjects} 个项目已有上线渠道`} icon={CheckCircle2} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-3.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索游戏、研发方、合作模式..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">接入中</SelectItem>
            <SelectItem value="paused">暂停</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-xl" />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-20 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 font-medium">没有匹配的项目</p>
          <p className="mt-1 text-sm text-muted-foreground">新项目可以直接创建，也可以从旧项目复制渠道框架。</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigateToProject(project.id)}
              onCopied={() => setRefreshKey((key) => key + 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onOpen, onCopied }: { project: Project; onOpen: () => void; onCopied: () => void }) {
  const channels = project.channels || []
  const progress = getChannelProgress(channels)
  const onlineCount = channels.filter((channel) => channel.launchStatus === 'online').length
  const status = statusConfig[project.status] || statusConfig.active

  return (
    <div className="group rounded-xl border border-border/50 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{project.name}</h2>
            <Badge className={cn('border-0', status.className)}>{status.label}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{project.gameType || '未填写游戏类型'}</p>
        </div>
        {project.cooperationMode && <Badge variant="outline">{project.cooperationMode}</Badge>}
      </div>

      <div className="mt-5 space-y-2.5 text-sm">
        <MetaRow icon={Building2} label="研发 / 合作方" value={project.partnerCompany || '未填写'} />
        <MetaRow icon={CalendarDays} label="计划首发" value={formatDate(project.launchDate) || '未安排'} />
        <MetaRow icon={Radio} label="渠道" value={`${channels.length} 个 · 已上线 ${onlineCount} 个`} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>渠道整体进度</span>
          <span className="font-medium tabular-nums text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-border/50 pt-4">
        <Button onClick={onOpen} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
          打开项目
        </Button>
        <CopyProjectDialog project={project} onCopied={onCopied} />
      </div>
    </div>
  )
}

function CopyProjectDialog({ project, onCopied }: { project: Project; onCopied: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`${project.name} - 新项目`)
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (value) setName(`${project.name} - 新项目`)
  }

  const handleCopy = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || '复制项目失败')
        return
      }
      toast.success('已复制项目框架，旧包名和审核状态没有带入')
      setOpen(false)
      onCopied()
    } catch (error) {
      console.error(error)
      toast.error('复制项目失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="复制项目">
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>复制项目框架</DialogTitle>
          <DialogDescription>
            会复制渠道名单、渠道类型和负责人；包名、AppID、审核状态、上线状态和项目资质会清空。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>新项目名称</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleCopy} disabled={loading || !name.trim()} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? '复制中...' : '确认复制'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCard({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-emerald-600" />
        {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {suffix && <span className="pb-0.5 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="w-[92px] shrink-0">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN')
}
