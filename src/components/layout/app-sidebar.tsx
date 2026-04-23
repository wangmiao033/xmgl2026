'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  Gamepad2,
  FileText,
  Search,
  X,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navItems: { title: string; icon: React.ElementType; view: ViewType }[] = [
  { title: '仪表板', icon: LayoutDashboard, view: 'dashboard' },
  { title: '我的任务', icon: CheckSquare, view: 'my-tasks' },
  { title: '项目列表', icon: FolderKanban, view: 'projects' },
  { title: '任务日历', icon: CalendarDays, view: 'calendar' },
  { title: '团队', icon: Users, view: 'team' },
  { title: '报表', icon: BarChart3, view: 'reports' },
  { title: '设置', icon: Settings, view: 'settings' },
]

interface QuickProject {
  id: string
  name: string
  docUrl?: string | null
  docName?: string | null
}

interface SearchResult {
  type: 'project' | 'task'
  id: string
  projectId?: string
  title: string
  subtitle?: string
}

export function AppSidebar() {
  const { currentView, setCurrentView, navigateToProject } = useAppStore()
  const [recentProjects, setRecentProjects] = useState<QuickProject[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects?limit=5')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setRecentProjects(data.slice(0, 5))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Derived: clear results when query is empty
  const effectiveResults = !searchQuery.trim() ? [] : searchResults

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) return

    const timer = setTimeout(async () => {
      try {
        const projectsRes = await fetch('/api/projects')
        const projects = await projectsRes.json()
        const query = searchQuery.toLowerCase()
        const results: SearchResult[] = []

        // Search projects
        for (const p of projects) {
          if (p.name.toLowerCase().includes(query)) {
            results.push({
              type: 'project',
              id: p.id,
              title: p.name,
              subtitle: '项目',
            })
          }
          // Search tasks in project
          if (p.tasks) {
            for (const t of p.tasks) {
              if (t.title.toLowerCase().includes(query)) {
                results.push({
                  type: 'task',
                  id: t.id,
                  projectId: p.id,
                  title: t.title,
                  subtitle: `任务 · ${p.name}`,
                })
              }
            }
          }
        }

        setSearchResults(results.slice(0, 10))
      } catch {
        // ignore
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'project') {
      navigateToProject(result.id)
    } else if (result.projectId) {
      navigateToProject(result.projectId)
    }
    setSearchQuery('')
    setShowSearch(false)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-700/50">
      <SidebarRail />
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-sm">
            PM
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-slate-100">项目管理</span>
            <span className="text-xs text-slate-400">企业内部管理系统</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div ref={searchRef} className="relative px-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索项目和任务..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearch(true)
                }}
                onFocus={() => setShowSearch(true)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 py-1.5 pl-8 pr-8 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    inputRef.current?.focus()
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {showSearch && searchQuery.trim() && (
              <div className="absolute top-full left-2 right-2 mt-1 z-50 rounded-md bg-slate-800 border border-slate-700 shadow-xl max-h-64 overflow-y-auto">
                {effectiveResults.length > 0 ? (
                  <div className="py-1">
                    {effectiveResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchSelect(result)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors"
                      >
                        {result.type === 'project' ? (
                          <FolderKanban className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <CheckSquare className="h-4 w-4 text-sky-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">
                    未找到匹配结果
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                    tooltip={item.title}
                    className="text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 data-[active=true]:bg-emerald-600/20 data-[active=true]:text-emerald-400"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent projects with doc links */}
        {recentProjects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400">项目快捷入口</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    {project.docUrl ? (
                      <a
                        href={project.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>svg]:size-4 [&>svg]:shrink-0',
                          'text-slate-400 hover:text-emerald-400'
                        )}
                        title={`打开 ${project.docName || project.name}`}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {project.docName || project.name}
                        </span>
                      </a>
                    ) : (
                      <SidebarMenuButton
                        onClick={() => navigateToProject(project.id)}
                        tooltip={project.name}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <Gamepad2 className="h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-600/20 text-emerald-400 text-xs">
              张
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-slate-200">张三</span>
            <span className="text-xs text-slate-400">管理员</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
