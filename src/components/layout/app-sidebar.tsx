'use client'

import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
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
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems: { title: string; icon: React.ElementType; view: ViewType }[] = [
  { title: '仪表板', icon: LayoutDashboard, view: 'dashboard' },
  { title: '我的任务', icon: CheckSquare, view: 'my-tasks' },
  { title: '项目列表', icon: FolderKanban, view: 'projects' },
  { title: '任务日历', icon: CalendarDays, view: 'calendar' },
  { title: '团队', icon: Users, view: 'team' },
  { title: '报表', icon: BarChart3, view: 'reports' },
  { title: '设置', icon: Settings, view: 'settings' },
]

export function AppSidebar() {
  const { currentView, setCurrentView } = useAppStore()

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-700/50">
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
