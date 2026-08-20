'use client'

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Gamepad2,
  Link2,
  Package,
  Pencil,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProjectChannel {
  id: string
  channelName: string
  channelType?: string | null
  packageName?: string | null
  appId?: string | null
  owner?: string | null
  paramsStatus: string
  packageStatus: string
  testingStatus: string
  reviewStatus: string
  launchStatus: string
  notes?: string | null
  sortOrder: number
}

interface ProjectFile {
  id: string
  name: string
  url: string
  category: string
  notes?: string | null
  createdAt: string
}

interface ProjectDetail {
  id: string
  name: string
  description?: string | null
  status: string
  category: string
  startDate?: string | null
  endDate?: string | null
  gameType?: string | null
  partnerCompany?: string | null
  contactName?: string | null
  contactPhone?: string | null
  cooperationMode?: string | null
  launchDate?: string | null
  isbn?: string | null
  copyrightNo?: string | null
  appRecordNo?: string | null
  antiAddictionNo?: string | null
  basePackageName?: string | null
  notes?: string | null
  docName?: string | null
  docUrl?: string | null
  channels: ProjectChannel[]
  files: ProjectFile[]
}

type TabKey = 'overview' | 'info' | 'channels' | 'files'

type StatusOption = { value: string; label: string }

const STATUS_OPTIONS: Record<'params' | 'package' | 'testing' | 'review' | 'launch', StatusOption[]> = {
  params: [
    { value: 'pending', label: '待获取' },
    { value: 'done', label: '已完成' },
  ],
  package: [
    { value: 'pending', label: '待出包' },
    { value: 'processing', label: '出包中' },
    { value: 'done', label: '已出包' },
    { value: 'failed', label: '失败' },
  ],
  testing: [
    { value: 'pending', label: '待提测' },
    { value: 'submitted', label: '已提测' },
    { value: 'passed', label: '已通过' },
    { value: 'failed', label: '未通过' },
  ],
  review: [
    { value: 'pending', label: '待审核' },
    { value: 'reviewing', label: '审核中' },
    { value: 'passed', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
  ],
  launch: [
    { value: 'pending', label: '待上线' },
    { value: 'scheduled', label: '待首发' },
    { value: 'online', label: '已上线' },
  ],
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

const commonChannels = ['OPPO', 'vivo', '小米', '华为', 'TapTap', '4399', '虫虫', '爱趣', '3011', '3733']

export function GameProjectDetailView() {
  const { selectedProjectId, setCurrentView } = useAppStore()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const fetchProject = useCallback(async () => {
    if (!selectedProjectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '加载失败')
      setProject(data)
    } catch (error) {
      console.error(error)
      toast.error('项目加载失败')
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    void fetchProject()
  }, [fetchProject])

  const progress = useMemo(() => getChannelProgress(project?.channels || []), [project?.channels])
  const onlineCount = project?.channels.filter((channel) => channel.launchStatus === 'online').length || 0
  const riskChannels = useMemo(
    () => (project?.channels || []).filter(isRiskChannel),
    [project?.channels]
  )

  const patchChannel = async (channelId: string, patch: Partial<ProjectChannel>) => {
    if (!project) return
    try {
      const res = await fetch(`/api/projects/${project.id}/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '更新失败')
      setProject((current) => current ? {
        ...current,
        channels: current.channels.map((channel) => channel.id === channelId ? data : channel),
      } : current)
    } catch (error) {
      console.error(error)
      toast.error('渠道更新失败')
    }
  }

  const deleteChannel = async (channel: ProjectChannel) => {
    if (!project || !window.confirm(`确认删除渠道「${channel.channelName}」？`)) return
    try {
      const res = await fetch(`/api/projects/${project.id}/channels/${channel.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setProject((current) => current ? {
        ...current,
        channels: current.channels.filter((item) => item.id !== channel.id),
      } : current)
      toast.success('渠道已删除')
    } catch (error) {
      console.error(error)
      toast.error('删除渠道失败')
    }
  }

  const deleteFile = async (file: ProjectFile) => {
    if (!project || !window.confirm(`确认删除资料「${file.name}」？`)) return
    try {
      const res = await fetch(`/api/projects/${project.id}/files/${file.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setProject((current) => current ? {
        ...current,
        files: current.files.filter((item) => item.id !== file.id),
      } : current)
      toast.success('资料已删除')
    } catch (error) {
      console.error(error)
      toast.error('删除资料失败')
    }
  }

  if (!selectedProjectId) {
    return (
      <EmptyState title="请选择项目" onBack={() => setCurrentView('projects')} />
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    )
  }

  if (!project) {
    return <EmptyState title="项目不存在或加载失败" onBack={() => setCurrentView('projects')} />
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => setCurrentView('projects')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回项目列表
      </button>

      <Card className="overflow-hidden border-border/50">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent" />
        <CardContent className="p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge className="border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {project.status === 'active' ? '接入中' : project.status === 'paused' ? '暂停' : project.status === 'completed' ? '已完成' : '已归档'}
                </Badge>
                {project.cooperationMode && <Badge variant="outline">{project.cooperationMode}</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span>{project.gameType || '未填写游戏类型'}</span>
                {project.partnerCompany && <span>合作方：{project.partnerCompany}</span>}
                {project.launchDate && <span>计划首发：{formatDate(project.launchDate)}</span>}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <EditProjectDialog project={project} onSaved={fetchProject} />
              {project.docUrl && (
                <Button variant="outline" asChild>
                  <a href={project.docUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    原资料
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Radio} label="接入渠道" value={project.channels.length} />
            <MetricCard icon={CheckCircle2} label="已上线" value={onlineCount} />
            <MetricCard icon={AlertTriangle} label="异常渠道" value={riskChannels.length} danger={riskChannels.length > 0} />
            <MetricCard icon={CalendarDays} label="计划首发" value={project.launchDate ? formatDate(project.launchDate) : '未安排'} />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>渠道整体推进</span>
              <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card p-1.5">
        {[
          ['overview', '总览'],
          ['info', '基础资料'],
          ['channels', `渠道进度 ${project.channels.length}`],
          ['files', `资料附件 ${project.files.length}`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm transition',
              activeTab === key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab project={project} riskChannels={riskChannels} onGoChannels={() => setActiveTab('channels')} />
      )}

      {activeTab === 'info' && (
        <ProjectInfoTab project={project} onSaved={fetchProject} />
      )}

      {activeTab === 'channels' && (
        <ChannelsTab
          project={project}
          onPatch={patchChannel}
          onDelete={deleteChannel}
          onAdded={fetchProject}
        />
      )}

      {activeTab === 'files' && (
        <FilesTab project={project} onAdded={fetchProject} onDelete={deleteFile} />
      )}
    </div>
  )
}

function OverviewTab({
  project,
  riskChannels,
  onGoChannels,
}: {
  project: ProjectDetail
  riskChannels: ProjectChannel[]
  onGoChannels: () => void
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">当前需要处理</h2>
              <p className="mt-1 text-sm text-muted-foreground">优先看审核驳回、提测失败和出包失败。</p>
            </div>
            <Button variant="outline" size="sm" onClick={onGoChannels}>查看渠道表</Button>
          </div>

          <div className="mt-4 space-y-2">
            {riskChannels.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                当前没有标记为失败或驳回的渠道。
              </div>
            ) : (
              riskChannels.slice(0, 8).map((channel) => (
                <div key={channel.id} className="flex items-start justify-between gap-3 rounded-xl border border-red-200/70 bg-red-50/60 p-3.5 dark:border-red-500/20 dark:bg-red-500/10">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">{channel.channelName}</p>
                    <p className="mt-1 text-xs text-red-600/80 dark:text-red-300/70">{getRiskReason(channel)}</p>
                  </div>
                  {channel.owner && <Badge variant="outline">{channel.owner}</Badge>}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <h2 className="font-semibold">项目关键资料</h2>
          <div className="mt-4 space-y-3">
            <InfoLine label="研发 / 合作方" value={project.partnerCompany} />
            <InfoLine label="合作模式" value={project.cooperationMode} />
            <InfoLine label="基础包名" value={project.basePackageName} mono />
            <InfoLine label="版号 / ISBN" value={project.isbn} />
            <InfoLine label="软著登记号" value={project.copyrightNo} />
            <InfoLine label="APP备案" value={project.appRecordNo} />
            <InfoLine label="防沉迷" value={project.antiAddictionNo} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProjectInfoTab({ project, onSaved }: { project: ProjectDetail; onSaved: () => Promise<void> }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">基础资料</h2>
            <p className="mt-1 text-sm text-muted-foreground">一个项目只维护一次，后续渠道直接复用。</p>
          </div>
          <EditProjectDialog project={project} onSaved={onSaved} />
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock icon={Gamepad2} label="游戏类型" value={project.gameType} />
          <InfoBlock icon={Building2} label="研发 / 合作方" value={project.partnerCompany} />
          <InfoBlock icon={Radio} label="合作模式" value={project.cooperationMode} />
          <InfoBlock icon={CalendarDays} label="接入日期" value={formatDate(project.startDate)} />
          <InfoBlock icon={CalendarDays} label="计划首发" value={formatDate(project.launchDate)} />
          <InfoBlock icon={Package} label="基础包名" value={project.basePackageName} mono />
          <InfoBlock icon={ShieldCheck} label="版号 / ISBN" value={project.isbn} />
          <InfoBlock icon={ShieldCheck} label="软著登记号" value={project.copyrightNo} />
          <InfoBlock icon={ShieldCheck} label="APP备案号" value={project.appRecordNo} />
          <InfoBlock icon={ShieldCheck} label="防沉迷备案码" value={project.antiAddictionNo} />
          <InfoBlock icon={Building2} label="联系人" value={project.contactName} />
          <InfoBlock icon={Building2} label="联系方式" value={project.contactPhone} />
        </div>

        {project.notes && (
          <div className="mt-6 rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">项目备注</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{project.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChannelsTab({
  project,
  onPatch,
  onDelete,
  onAdded,
}: {
  project: ProjectDetail
  onPatch: (channelId: string, patch: Partial<ProjectChannel>) => Promise<void>
  onDelete: (channel: ProjectChannel) => Promise<void>
  onAdded: () => Promise<void>
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">渠道接入进度</h2>
            <p className="mt-1 text-sm text-muted-foreground">状态直接在表格里改，失焦或选择后自动保存。</p>
          </div>
          <AddChannelDialog projectId={project.id} onAdded={onAdded} />
        </div>

        {project.channels.length === 0 ? (
          <div className="py-20 text-center">
            <Radio className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 font-medium">还没有渠道</p>
            <p className="mt-1 text-sm text-muted-foreground">可以批量加入 OPPO、vivo、小米、TapTap 等渠道。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <Th>渠道</Th>
                  <Th>类型</Th>
                  <Th>包名</Th>
                  <Th>AppID</Th>
                  <Th>参数</Th>
                  <Th>出包</Th>
                  <Th>提测</Th>
                  <Th>审核</Th>
                  <Th>上线</Th>
                  <Th>负责人</Th>
                  <Th>备注</Th>
                  <Th className="w-[64px]">操作</Th>
                </tr>
              </thead>
              <tbody>
                {project.channels.map((channel) => (
                  <tr key={channel.id} className="border-t border-border/50 align-middle hover:bg-muted/20">
                    <Td>
                      <InlineText value={channel.channelName} onSave={(value) => onPatch(channel.id, { channelName: value })} className="w-[110px] font-medium" />
                    </Td>
                    <Td>
                      <InlineText value={channel.channelType || ''} onSave={(value) => onPatch(channel.id, { channelType: value })} className="w-[92px]" placeholder="混服/硬核" />
                    </Td>
                    <Td>
                      <InlineText value={channel.packageName || ''} onSave={(value) => onPatch(channel.id, { packageName: value })} className="w-[190px] font-mono text-xs" placeholder="com.xxx.channel" />
                    </Td>
                    <Td>
                      <InlineText value={channel.appId || ''} onSave={(value) => onPatch(channel.id, { appId: value })} className="w-[120px] font-mono text-xs" placeholder="AppID" />
                    </Td>
                    <Td><StatusSelect type="params" value={channel.paramsStatus} onChange={(value) => onPatch(channel.id, { paramsStatus: value })} /></Td>
                    <Td><StatusSelect type="package" value={channel.packageStatus} onChange={(value) => onPatch(channel.id, { packageStatus: value })} /></Td>
                    <Td><StatusSelect type="testing" value={channel.testingStatus} onChange={(value) => onPatch(channel.id, { testingStatus: value })} /></Td>
                    <Td><StatusSelect type="review" value={channel.reviewStatus} onChange={(value) => onPatch(channel.id, { reviewStatus: value })} /></Td>
                    <Td><StatusSelect type="launch" value={channel.launchStatus} onChange={(value) => onPatch(channel.id, { launchStatus: value })} /></Td>
                    <Td>
                      <InlineText value={channel.owner || ''} onSave={(value) => onPatch(channel.id, { owner: value })} className="w-[90px]" placeholder="负责人" />
                    </Td>
                    <Td>
                      <InlineText value={channel.notes || ''} onSave={(value) => onPatch(channel.id, { notes: value })} className="w-[180px]" placeholder="驳回原因 / 待办" />
                    </Td>
                    <Td>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600" onClick={() => onDelete(channel)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FilesTab({
  project,
  onAdded,
  onDelete,
}: {
  project: ProjectDetail
  onAdded: () => Promise<void>
  onDelete: (file: ProjectFile) => Promise<void>
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">资料附件</h2>
            <p className="mt-1 text-sm text-muted-foreground">V1 先统一管理文件链接，后续再接 R2 直接上传。</p>
          </div>
          <AddFileDialog projectId={project.id} onAdded={onAdded} />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {project.docUrl && (
            <FileCard
              name={project.docName || '原项目资料'}
              url={project.docUrl}
              category="原始资料"
            />
          )}
          {project.files.map((file) => (
            <FileCard
              key={file.id}
              name={file.name}
              url={file.url}
              category={fileCategoryLabel(file.category)}
              notes={file.notes}
              onDelete={() => onDelete(file)}
            />
          ))}
        </div>

        {!project.docUrl && project.files.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 font-medium">还没有项目资料</p>
            <p className="mt-1 text-sm text-muted-foreground">先把合同、授权、版号、素材盘等链接统一放这里。</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddChannelDialog({ projectId, onAdded }: { projectId: string; onAdded: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [names, setNames] = useState('')
  const [channelType, setChannelType] = useState('')
  const [owner, setOwner] = useState('')
  const [loading, setLoading] = useState(false)

  const appendChannel = (name: string) => {
    const current = names.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean)
    if (current.includes(name)) return
    setNames([...current, name].join('\n'))
  }

  const handleAdd = async () => {
    const channelNames = names.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean)
    if (!channelNames.length) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelNames, channelType, owner }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '添加失败')
      toast.success(`已添加 ${Array.isArray(data) ? data.length : 1} 个渠道`)
      setOpen(false)
      setNames('')
      setChannelType('')
      setOwner('')
      await onAdded()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : '添加渠道失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          添加渠道
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>批量添加渠道</DialogTitle>
          <DialogDescription>每行一个渠道。复制项目后，通常不需要再重复录这一步。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>常用渠道</Label>
            <div className="flex flex-wrap gap-2">
              {commonChannels.map((channel) => (
                <button
                  type="button"
                  key={channel}
                  onClick={() => appendChannel(channel)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  + {channel}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>渠道名称 *</Label>
            <Textarea value={names} onChange={(event) => setNames(event.target.value)} rows={7} placeholder={'OPPO\nvivo\n小米\n华为'} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>渠道类型</Label>
              <Input value={channelType} onChange={(event) => setChannelType(event.target.value)} placeholder="例如：硬核 / 混服 / 专服" />
            </div>
            <div className="space-y-2">
              <Label>默认负责人</Label>
              <Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="例如：阿金" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button disabled={loading || !names.trim()} onClick={handleAdd} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? '添加中...' : '添加渠道'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddFileDialog({ projectId, onAdded }: { projectId: string; onAdded: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('contract')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '添加失败')
      toast.success('资料已添加')
      setOpen(false)
      setName('')
      setUrl('')
      setNotes('')
      await onAdded()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : '添加资料失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          添加资料
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>添加项目资料</DialogTitle>
          <DialogDescription>第一版先保存链接，适合合同、授权、素材盘和在线文档。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>资料名称 *</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：联运合同" />
          </div>
          <div className="space-y-2">
            <Label>资料链接 *</Label>
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>分类</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">合同</SelectItem>
                <SelectItem value="authorization">授权 / 资质</SelectItem>
                <SelectItem value="material">素材</SelectItem>
                <SelectItem value="package">包体 / 技术资料</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button disabled={loading || !name.trim() || !url.trim()} onClick={handleAdd} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? '保存中...' : '保存资料'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditProjectDialog({ project, onSaved }: { project: ProjectDetail; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(() => projectForm(project))

  useEffect(() => {
    if (open) setForm(projectForm(project))
  }, [open, project])

  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '保存失败')
      toast.success('项目资料已保存')
      setOpen(false)
      await onSaved()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          编辑资料
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>编辑项目资料</DialogTitle>
          <DialogDescription>这些是项目固定资料，不需要按渠道重复填写。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="项目 / 游戏名称" value={form.name} onChange={(value) => setField('name', value)} className="sm:col-span-2" />
          <FormInput label="游戏类型" value={form.gameType} onChange={(value) => setField('gameType', value)} />
          <FormInput label="合作模式" value={form.cooperationMode} onChange={(value) => setField('cooperationMode', value)} />
          <FormInput label="研发 / 合作方" value={form.partnerCompany} onChange={(value) => setField('partnerCompany', value)} />
          <FormInput label="基础包名" value={form.basePackageName} onChange={(value) => setField('basePackageName', value)} />
          <FormInput label="联系人" value={form.contactName} onChange={(value) => setField('contactName', value)} />
          <FormInput label="联系方式" value={form.contactPhone} onChange={(value) => setField('contactPhone', value)} />
          <FormInput label="接入日期" type="date" value={form.startDate} onChange={(value) => setField('startDate', value)} />
          <FormInput label="计划首发" type="date" value={form.launchDate} onChange={(value) => setField('launchDate', value)} />
          <FormInput label="版号 / ISBN" value={form.isbn} onChange={(value) => setField('isbn', value)} />
          <FormInput label="软著登记号" value={form.copyrightNo} onChange={(value) => setField('copyrightNo', value)} />
          <FormInput label="APP备案号" value={form.appRecordNo} onChange={(value) => setField('appRecordNo', value)} />
          <FormInput label="防沉迷备案码" value={form.antiAddictionNo} onChange={(value) => setField('antiAddictionNo', value)} />
          <div className="space-y-2">
            <Label>项目状态</Label>
            <Select value={form.status} onValueChange={(value) => setField('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">接入中</SelectItem>
                <SelectItem value="paused">暂停</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>项目备注</Label>
            <Textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button disabled={loading || !form.name.trim()} onClick={handleSave} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusSelect({
  type,
  value,
  onChange,
}: {
  type: keyof typeof STATUS_OPTIONS
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('h-8 w-[94px] text-xs', statusTone(value))}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS[type].map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function InlineText({
  value,
  onSave,
  className,
  placeholder,
}: {
  value: string
  onSave: (value: string) => Promise<void>
  className?: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value)

  return (
    <Input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft.trim() !== value.trim()) void onSave(draft.trim())
      }}
      placeholder={placeholder}
      className={cn('h-8 border-transparent bg-transparent px-2 hover:border-border focus:border-input focus:bg-background', className)}
    />
  )
}

function FileCard({
  name,
  url,
  category,
  notes,
  onDelete,
}: {
  name: string
  url: string
  category: string
  notes?: string | null
  onDelete?: () => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10">
        <Link2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{name}</p>
          <Badge variant="outline" className="text-[11px]">{category}</Badge>
        </div>
        {notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notes}</p>}
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline">
          打开资料 <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {onDelete && (
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-red-600" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, danger }: { icon: ElementType; label: string; value: string | number; danger?: boolean }) {
  return (
    <div className={cn('rounded-xl border p-3.5', danger ? 'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/10' : 'border-border/50 bg-muted/20')}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn('h-4 w-4', danger ? 'text-red-500' : 'text-emerald-600')} />
        {label}
      </div>
      <div className={cn('mt-2 text-xl font-semibold', danger && 'text-red-600 dark:text-red-300')}>{value}</div>
    </div>
  )
}

function InfoBlock({ icon: Icon, label, value, mono }: { icon: ElementType; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('mt-1 break-words text-sm font-medium', mono && 'font-mono text-xs')}>{value || '未填写'}</p>
      </div>
    </div>
  )
}

function InfoLine({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('break-words font-medium', mono && 'font-mono text-xs')}>{value || '未填写'}</span>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text', className }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-3 py-3 font-medium', className)}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-1.5 py-2">{children}</td>
}

function EmptyState({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="py-20 text-center">
      <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
      <p className="mt-4 font-medium">{title}</p>
      <Button variant="outline" className="mt-4" onClick={onBack}>返回项目列表</Button>
    </div>
  )
}

function getChannelProgress(channels: ProjectChannel[]) {
  if (!channels.length) return 0
  const total = channels.reduce((sum, channel) => {
    const steps = [channel.paramsStatus, channel.packageStatus, channel.testingStatus, channel.reviewStatus, channel.launchStatus]
    return sum + steps.reduce((stepSum, value) => stepSum + (statusWeight[value] ?? 0), 0) / steps.length
  }, 0)
  return Math.round((total / channels.length) * 100)
}

function isRiskChannel(channel: ProjectChannel) {
  return channel.packageStatus === 'failed' || channel.testingStatus === 'failed' || channel.reviewStatus === 'rejected'
}

function getRiskReason(channel: ProjectChannel) {
  const reasons: string[] = []
  if (channel.packageStatus === 'failed') reasons.push('出包失败')
  if (channel.testingStatus === 'failed') reasons.push('提测未通过')
  if (channel.reviewStatus === 'rejected') reasons.push('审核驳回')
  return reasons.join('、') || '需要处理'
}

function statusTone(value: string) {
  if (['done', 'passed', 'online'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
  if (['processing', 'submitted', 'reviewing', 'scheduled'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
  if (['failed', 'rejected'].includes(value)) return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
  return 'border-border bg-background text-muted-foreground'
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN')
}

function dateInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function projectForm(project: ProjectDetail) {
  return {
    name: project.name || '',
    status: project.status || 'active',
    gameType: project.gameType || '',
    partnerCompany: project.partnerCompany || '',
    contactName: project.contactName || '',
    contactPhone: project.contactPhone || '',
    cooperationMode: project.cooperationMode || '',
    startDate: dateInput(project.startDate),
    launchDate: dateInput(project.launchDate),
    isbn: project.isbn || '',
    copyrightNo: project.copyrightNo || '',
    appRecordNo: project.appRecordNo || '',
    antiAddictionNo: project.antiAddictionNo || '',
    basePackageName: project.basePackageName || '',
    notes: project.notes || '',
  }
}

function fileCategoryLabel(category: string) {
  return ({
    contract: '合同',
    authorization: '授权 / 资质',
    material: '素材',
    package: '包体 / 技术资料',
    other: '其他',
  } as Record<string, string>)[category] || '其他'
}
