'use client'

import { useEffect, useState } from 'react'
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

export function AppSidebar() {
  const { currentView, setCurrentView, navigateToProject } = useAppStore()
  const [recentProjects, setRecentProjects] = useState<QuickProject[]>([])

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
