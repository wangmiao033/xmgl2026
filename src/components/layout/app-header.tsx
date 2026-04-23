'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell, LogOut, User as UserIcon, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const viewTitles: Record<string, string> = {
  dashboard: '仪表板',
  projects: '项目列表',
  'project-detail': '项目详情',
  team: '团队管理',
  settings: '系统设置',
  'my-tasks': '我的任务',
  calendar: '任务日历',
  reports: '数据报表',
  passwords: '密码管理',
}

interface HeaderUser {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
}

interface AppHeaderProps {
  currentUser?: HeaderUser
  onLogout?: () => void
}

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '经理',
  member: '成员',
}

export function AppHeader({ currentUser, onLogout }: AppHeaderProps) {
  const { currentView } = useAppStore()
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const month = now.getMonth() + 1
      const day = now.getDate()
      const weekday = weekdays[now.getDay()]
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${month}月${day}日 ${weekday}  ${hours}:${minutes}:${seconds}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const getParentView = () => {
    if (currentView === 'project-detail') return { title: '项目列表', view: 'projects' as const }
    return null
  }

  const parent = getParentView()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-card/60 backdrop-blur-xl px-6 sticky top-0 z-10">
      <SidebarTrigger className="-ml-2 h-8 w-8" />
      <div className="h-5 w-px bg-border/50" />
      <Breadcrumb>
        <BreadcrumbList>
          {parent && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    const store = useAppStore.getState()
                    store.setCurrentView(parent.view)
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {parent.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-[15px]">{viewTitles[currentView] || currentView}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {currentTime && (
          <span className="hidden md:inline-flex items-center text-[13px] text-muted-foreground tabular-nums font-medium tracking-tight mr-2">
            {currentTime}
          </span>
        )}

        {currentUser && (
          <div className="flex items-center gap-2">
            {/* User badge */}
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-muted/40 border border-border/30">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[13px] font-medium text-foreground">{currentUser.name}</span>
                <span className="text-[11px] text-muted-foreground ml-1.5">({roleLabels[currentUser.role] || currentUser.role})</span>
              </div>
            </div>

            {/* Logout */}
            {onLogout && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={onLogout}
                    >
                      <LogOut className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>退出登录</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
