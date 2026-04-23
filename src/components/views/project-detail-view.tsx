'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { TaskCard } from '@/components/layout/task-card'
import { CreateTaskDialog } from '@/components/layout/create-task-dialog'
import { EditTaskDialog } from '@/components/layout/edit-task-dialog'
import { EditProjectDialog } from '@/components/layout/edit-project-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus, ArrowLeft, Trash2, ExternalLink, FileText, Pencil, Gamepad2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TaskAssignee { id: string; userId: string; user: { id: string; name: string } }
interface Task { id: string; title: string; description?: string | null; priority: string; status: string; order: number; dueDate?: string | null; columnId?: string | null; assignees: TaskAssignee[] }
interface TaskColumn { id: string; title: string; order: number; tasks: Task[] }
interface ProjectMember { id: string; role: string; user: { id: string; name: string; email: string } }
interface ProjectDetail { id: string; name: string; description?: string | null; status: string; priority: string; category: string; docUrl?: string | null; docName?: string | null; progress: number; startDate?: string | null; endDate?: string | null; members: ProjectMember[]; columns: TaskColumn[]; _count: { tasks: number; members: number } }

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '进行中', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  paused: { label: '已暂停', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  completed: { label: '已完成', className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' },
  archived: { label: '已归档', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' },
}
const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' },
  medium: { label: '中', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

const columnStyles: Record<string, { accent: string; badge: string; bg: string }> = {
  '待办': { accent: 'from-slate-400 to-slate-500', badge: 'bg-slate-500', bg: 'bg-slate-50/70 dark:bg-slate-900/30' },
  '进行中': { accent: 'from-sky-400 to-sky-500', badge: 'bg-sky-500', bg: 'bg-sky-50/50 dark:bg-sky-900/20' },
  '审核中': { accent: 'from-amber-400 to-amber-500', badge: 'bg-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/20' },
  '已完成': { accent: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20' },
}

const columnTitleToStatus: Record<string, string> = { '待办': 'todo', '进行中': 'in_progress', '审核中': 'review', '已完成': 'done' }

function DraggableTaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task, columnId: task.columnId } })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('transition-opacity', isDragging && 'opacity-40 scale-[1.02]')}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}

function DroppableColumn({ column, children }: { column: TaskColumn; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { column } })
  return (
    <div ref={setNodeRef} className={cn('transition-all duration-200 rounded-xl', isOver && 'ring-2 ring-primary/40 ring-offset-2 bg-primary/5')}>
      {children}
    </div>
  )
}

export function ProjectDetailView() {
  const { selectedProjectId, setCurrentView } = useAppStore()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string | undefined>()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchProject = useCallback(() => {
    if (!selectedProjectId) return
    let cancelled = false
    fetch(`/api/projects/${selectedProjectId}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) { setProject(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedProjectId])

  useEffect(() => { fetchProject() }, [selectedProjectId, refreshKey, fetchProject])

  const handleAddTask = (columnId: string) => { setSelectedColumnId(columnId); setTaskDialogOpen(true) }
  const handleEditTask = (task: Task) => { setSelectedTask(task); setEditTaskDialogOpen(true) }

  const handleDeleteTask = async (taskId: string) => {
    try { await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }); toast.success('任务已删除'); setRefreshKey((k) => k + 1) } catch (e) { console.error(e) }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return
    try { await fetch(`/api/projects/${selectedProjectId}`, { method: 'DELETE' }); toast.success('项目已删除'); setCurrentView('projects') } catch (e) { console.error(e) }
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!project) return
    const task = project.columns.flatMap((c) => c.tasks).find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    if (!over || !project || event.active.id === event.over?.id) return
    const { active, over } = event
    const sourceTask = project.columns.flatMap((c) => c.tasks).find((t) => t.id === active.id)
    if (!sourceTask) return
    const destColumn = project.columns.find((c) => c.id === over.id)
    if (!destColumn || sourceTask.columnId === destColumn.id) return
    const newStatus = columnTitleToStatus[destColumn.title] || sourceTask.status
    try {
      const res = await fetch(`/api/tasks/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ columnId: destColumn.id, status: newStatus }) })
      if (res.ok) { toast.success(`任务已移动到${destColumn.title}`); setRefreshKey((k) => k + 1) }
    } catch (e) { console.error(e) }
  }

  if (!selectedProjectId) {
    return (<div className="text-center py-16 text-muted-foreground"><p className="text-[15px]">请选择一个项目查看详情</p><Button variant="outline" className="mt-4" onClick={() => setCurrentView('projects')}>返回项目列表</Button></div>)
  }

  if (loading) {
    return (<div className="space-y-5"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 rounded-xl" /><div className="grid grid-cols-4 gap-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div></div>)
  }

  if (!project) {
    return (<div className="text-center py-16 text-muted-foreground"><p className="text-[15px]">项目不存在或已被删除</p><Button variant="outline" className="mt-4" onClick={() => setCurrentView('projects')}>返回项目列表</Button></div>)
  }

  const status = statusConfig[project.status] || statusConfig.active
  const priority = priorityConfig[project.priority] || priorityConfig.medium
  const isGame = project.category === 'game'
  const totalTasks = project.columns.reduce((sum, col) => sum + col.tasks.length, 0)

  return (
    <div className="space-y-6">
      <button onClick={() => setCurrentView('projects')} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors -ml-1">
        <ArrowLeft className="h-4 w-4" /> 返回项目列表
      </button>

      {/* Header */}
      <Card className="overflow-hidden shadow-card border-border/50">
        {isGame && <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />}
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {isGame && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                    <Gamepad2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant="secondary" className={cn('text-[11px] px-2.5 py-0.5 font-medium', status.className)}>{status.label}</Badge>
                <Badge variant="outline" className={cn('text-[11px] px-2.5 py-0.5 font-medium', priority.className)}>{priority.label}优先级</Badge>
              </div>
              {project.description && <p className="text-[14px] text-muted-foreground leading-relaxed">{project.description}</p>}
              <div className="flex items-center gap-5 text-[13px] text-muted-foreground flex-wrap">
                <span>{project._count.tasks} 个任务</span>
                <span>{project._count.members} 名成员</span>
                {project.startDate && <span>开始: {new Date(project.startDate).toLocaleDateString('zh-CN')}</span>}
                {project.endDate && <span>截止: {new Date(project.endDate).toLocaleDateString('zh-CN')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="text-[13px]">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />编辑
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-[13px] text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>确认删除</AlertDialogTitle><AlertDialogDescription>确定要删除项目&ldquo;{project.name}&rdquo;吗？此操作不可撤销。</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">项目进度</span>
              <span className="font-semibold tabular-nums">{project.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-500',
                project.progress >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : project.progress >= 50 ? 'bg-gradient-to-r from-sky-400 to-sky-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'
              )} style={{ width: `${project.progress}%` }} />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <span className="text-[13px] text-muted-foreground">成员</span>
            <div className="flex -space-x-2">
              {project.members.map((member) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-card shadow-sm">
                  <AvatarFallback className="text-[11px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 font-medium">{member.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          {project.docUrl && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <a href={project.docUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200/60 dark:border-emerald-500/20 hover:shadow-card-hover transition-all group">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shrink-0 shadow-md shadow-emerald-500/25">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">{project.docName || '打开在线文档'}</p>
                  <p className="text-[12px] text-muted-foreground truncate mt-0.5">{project.docUrl}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-500 shrink-0" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {project.columns.map((column) => {
            const style = columnStyles[column.title] || columnStyles['待办']
            return (
              <DroppableColumn key={column.id} column={column}>
                <Card className={cn('shadow-card border-border/50 overflow-hidden', style.bg)}>
                  {/* Column accent bar */}
                  <div className={cn('h-1 bg-gradient-to-r', style.accent)} />
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CardTitle className="text-[14px] font-semibold">{column.title}</CardTitle>
                        <span className={cn('inline-flex items-center justify-center h-5 min-w-5 rounded-md px-1.5 text-[11px] font-semibold text-white', style.badge)}>
                          {column.tasks.length}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px] text-primary hover:bg-primary/10"
                        onClick={() => handleAddTask(column.id)}>
                        <Plus className="h-3.5 w-3.5 mr-0.5" />添加
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 max-h-[420px] overflow-y-auto px-3 pb-2">
                    {column.tasks.map((task) => (
                      <div key={task.id} className="relative group">
                        <DraggableTaskCard task={task} onClick={() => handleEditTask(task)} />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="h-6 w-6 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border/60 shadow-sm hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); handleEditTask(task) }}>
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="h-6 w-6 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border/60 shadow-sm hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>删除任务</AlertDialogTitle><AlertDialogDescription>确定要删除任务&ldquo;{task.title}&rdquo;吗？</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="text-center py-10 text-[13px] text-muted-foreground/60 border-2 border-dashed border-border/30 rounded-lg mx-1">
                        暂无任务
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 opacity-90 rotate-2 shadow-float rounded-xl overflow-hidden">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} projectId={selectedProjectId} columns={project.columns} defaultColumnId={selectedColumnId} onCreated={() => { toast.success('任务创建成功'); setRefreshKey((k) => k + 1) }} />
      <EditTaskDialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen} task={selectedTask} projectId={selectedProjectId} columns={project.columns} onUpdated={() => { toast.success('任务更新成功'); setRefreshKey((k) => k + 1) }} />
      <EditProjectDialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { toast.success('项目信息已更新'); setRefreshKey((k) => k + 1) } }} projectId={selectedProjectId} onUpdated={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
