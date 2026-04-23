'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut, User as UserIcon, Shield, Crown, Users, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnlineUsers } from '@/hooks/use-online-users'

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

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  member: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
}

const roleAvatarColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  member: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
}

export function AppHeader({ currentUser, onLogout }: AppHeaderProps) {
  const { currentView } = useAppStore()
  const [currentTime, setCurrentTime] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { onlineUsers, onlineCount } = useOnlineUsers()

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelOpen])

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

        {/* Online members indicator */}
        <div className="relative" ref={panelRef}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  onClick={() => setPanelOpen(!panelOpen)}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {onlineCount > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className={cn(
                      'relative inline-flex rounded-full h-2.5 w-2.5',
                      onlineCount > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                  </span>
                  <span className="hidden sm:inline text-muted-foreground">
                    {onlineCount}人在线
                  </span>
                  <Users className="h-3.5 w-3.5 text-muted-foreground sm:hidden" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{onlineCount} 位成员在线</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Online members dropdown panel */}
          {panelOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border/50 bg-card shadow-lg shadow-black/5 backdrop-blur-xl z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span className="text-[13px] font-semibold text-foreground">在线成员</span>
                  <Badge variant="secondary" className="ml-auto text-[11px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {onlineCount}
                  </Badge>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto py-1.5">
                {onlineUsers.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-[13px] text-muted-foreground">暂无在线成员</p>
                  </div>
                ) : (
                  onlineUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(
                            'text-xs font-semibold',
                            roleAvatarColors[user.role] || roleAvatarColors.member
                          )}>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className={cn(
                        'text-[10px] px-1.5 py-0 font-medium shrink-0',
                        roleColors[user.role] || roleColors.member
                      )}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
