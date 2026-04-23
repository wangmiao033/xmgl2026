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
import { Bell } from 'lucide-react'
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

export function AppHeader() {
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

      <div className="ml-auto flex items-center gap-3">
        {currentTime && (
          <span className="hidden md:inline-flex items-center text-[13px] text-muted-foreground tabular-nums font-medium tracking-tight">
            {currentTime}
          </span>
        )}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-muted/60">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </Button>
      </div>
    </header>
  )
}
