'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from '@/components/layout/project-card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  category: string
  docUrl?: string | null
  docName?: string | null
  progress: number
  createdAt: string
  _count?: {
    tasks: number
    members: number
  }
  members?: any[]
}

export function ProjectsView() {
  const { navigateToProject } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProjects(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (project.docName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目列表</h1>
          <p className="text-muted-foreground">管理所有项目，共 {projects.length} 个</p>
        </div>
        <CreateProjectDialog onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目名称、描述、文档名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="类型筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="game">游戏项目</SelectItem>
            <SelectItem value="tool">工具项目</SelectItem>
            <SelectItem value="website">网站项目</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">进行中</SelectItem>
            <SelectItem value="paused">已暂停</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无匹配的项目</p>
          <p className="text-sm mt-1">尝试调整筛选条件，或点击&ldquo;新建项目&rdquo;创建新项目</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                ...project,
                taskCount: project._count?.tasks,
                memberCount: project._count?.members,
              }}
              onClick={() => navigateToProject(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
