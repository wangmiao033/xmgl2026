'use client'

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

  const getParentView = () => {
    if (currentView === 'project-detail') return { title: '项目列表', view: 'projects' as const }
    return null
  }

  const parent = getParentView()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-md px-6 sticky top-0 z-10">
      <SidebarTrigger className="-ml-2 h-8 w-8" />
      <div className="h-5 w-px bg-border/60" />
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
    </header>
  )
}
