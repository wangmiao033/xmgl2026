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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus, ArrowLeft, Trash2, ExternalLink, FileText, Pencil, Gamepad2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TaskAssignee {
  id: string
  userId: string
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
  order: number
  dueDate?: string | null
  columnId?: string | null
  assignees: TaskAssignee[]
}

interface TaskColumn {
  id: string
  title: string
  order: number
  tasks: Task[]
}

interface ProjectMember {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface ProjectDetail {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  category: string
  docUrl?: string | null
  docName?: string | null
  progress: number
  startDate?: string | null
  endDate?: string | null
  members: ProjectMember[]
  columns: TaskColumn[]
  _count: {
    tasks: number
    members: number
  }
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

const columnBorderColors: Record<string, string> = {
  '待办': 'border-t-slate-400',
  '进行中': 'border-t-sky-500',
  '审核中': 'border-t-amber-500',
  '已完成': 'border-t-emerald-500',
}

const columnBgColors: Record<string, string> = {
  '待办': 'bg-slate-50/50 dark:bg-slate-900/20',
  '进行中': 'bg-sky-50/50 dark:bg-sky-900/10',
  '审核中': 'bg-amber-50/50 dark:bg-amber-900/10',
  '已完成': 'bg-emerald-50/50 dark:bg-emerald-900/10',
}

const columnTitleToStatus: Record<string, string> = {
  '待办': 'todo',
  '进行中': 'in_progress',
  '审核中': 'review',
  '已完成': 'done',
}

// Draggable wrapper for task cards
function DraggableTaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, columnId: task.columnId },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(isDragging && 'opacity-50')}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}

// Droppable column wrapper
function DroppableColumn({
  column,
  children,
}: {
  column: TaskColumn
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors',
        isOver && 'ring-2 ring-emerald-400 ring-offset-2 rounded-lg'
      )}
    >
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const fetchProject = useCallback(() => {
    if (!selectedProjectId) return
    let cancelled = false
    fetch(`/api/projects/${selectedProjectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProject(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedProjectId])

  useEffect(() => {
    fetchProject()
  }, [selectedProjectId, refreshKey, fetchProject])

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditTaskDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      toast.success('任务已删除')
      setRefreshKey((k) => k + 1)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return
    try {
      await fetch(`/api/projects/${selectedProjectId}`, { method: 'DELETE' })
      toast.success('项目已删除')
      setCurrentView('projects')
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleTaskCreated = () => {
    toast.success('任务创建成功')
    setRefreshKey((k) => k + 1)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (!project) return
    // Find the task from all columns
    const task = project.columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !project || active.id === over.id) return

    // Find source task and destination column
    const sourceTask = project.columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id)

    if (!sourceTask) return

    const destColumn = project.columns.find((col) => col.id === over.id)
    if (!destColumn || sourceTask.columnId === destColumn.id) return

    // Map column title to status
    const newStatus = columnTitleToStatus[destColumn.title] || sourceTask.status

    try {
      const res = await fetch(`/api/tasks/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: destColumn.id,
          status: newStatus,
        }),
      })

      if (res.ok) {
        toast.success(`任务已移动到${destColumn.title}`)
        setRefreshKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Error moving task:', error)
    }
  }

  if (!selectedProjectId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>请选择一个项目查看详情</p>
        <Button variant="outline" className="mt-4" onClick={() => setCurrentView('projects')}>
          返回项目列表
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>项目不存在或已被删除</p>
        <Button variant="outline" className="mt-4" onClick={() => setCurrentView('projects')}>
          返回项目列表
        </Button>
      </div>
    )
  }

  const status = statusConfig[project.status] || statusConfig.active
  const priority = priorityConfig[project.priority] || priorityConfig.medium
  const isGame = project.category === 'game'
  const totalTasks = project.columns.reduce((sum, col) => sum + col.tasks.length, 0)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => setCurrentView('projects')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回项目列表
      </button>

      {/* Project header */}
      <Card className="overflow-hidden">
        {isGame && (
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        )}
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {isGame && <Gamepad2 className="h-5 w-5 text-emerald-500" />}
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant="secondary" className={status.className}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className={priority.className}>
                  {priority.label}优先级
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{project._count.tasks} 个任务</span>
                <span>{project._count.members} 名成员</span>
                {project.startDate && (
                  <span>开始: {new Date(project.startDate).toLocaleDateString('zh-CN')}</span>
                )}
                {project.endDate && (
                  <span>截止: {new Date(project.endDate).toLocaleDateString('zh-CN')}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                编辑
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除项目&quot;{project.name}&quot;吗？此操作不可撤销，所有相关任务也将被删除。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">项目进度</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Members */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">成员:</span>
            <div className="flex -space-x-1.5">
              {project.members.map((member) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {member.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          {/* Document Link - Prominent */}
          {project.docUrl && (
            <div className="mt-5 pt-5 border-t">
              <a
                href={project.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 group-hover:underline">
                    {project.docName || '打开在线文档'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.docUrl}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-500 shrink-0" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {project.columns.map((column) => {
            const borderColor = columnBorderColors[column.title] || 'border-t-slate-400'
            const bgColor = columnBgColors[column.title] || ''

            // Badge color based on column
            const badgeColor: Record<string, string> = {
              '待办': 'bg-slate-500',
              '进行中': 'bg-sky-500',
              '审核中': 'bg-amber-500',
              '已完成': 'bg-emerald-500',
            }

            return (
              <DroppableColumn key={column.id} column={column}>
                <Card
                  className={cn(
                    'border-t-4',
                    borderColor,
                    bgColor
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {column.title}
                        <Badge className={cn('text-[10px] px-1.5 py-0 text-white', badgeColor[column.title] || 'bg-slate-500')}>
                          {column.tasks.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleAddTask(column.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        添加
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      共 {column.tasks.length} 个任务
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {column.tasks.map((task) => (
                      <div key={task.id} className="relative group">
                        <DraggableTaskCard
                          task={task}
                          onClick={() => handleEditTask(task)}
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="h-6 w-6 rounded-md bg-background/80 dark:bg-card/80 flex items-center justify-center border border-border shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTask(task)
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-emerald-500" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="h-6 w-6 rounded-md bg-background/80 dark:bg-card/80 flex items-center justify-center border border-border shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>删除任务</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除任务&quot;{task.title}&quot;吗？
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        暂无任务
                      </div>
                    )}
                  </CardContent>
                  {/* Column footer summary */}
                  <div className="px-4 py-2 border-t text-[10px] text-muted-foreground">
                    {column.tasks.length} / {totalTasks} 任务
                  </div>
                </Card>
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 opacity-80 rotate-3">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create task dialog */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={selectedProjectId}
        columns={project.columns}
        defaultColumnId={selectedColumnId}
        onCreated={handleTaskCreated}
      />

      {/* Edit task dialog */}
      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        task={selectedTask}
        projectId={selectedProjectId}
        columns={project.columns}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Edit project dialog */}
      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            toast.success('项目信息已更新')
            setRefreshKey((k) => k + 1)
          }
        }}
        projectId={selectedProjectId}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
