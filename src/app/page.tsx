'use client'

import { useAppStore } from '@/stores/app-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProjectsView } from '@/components/views/projects-view'
import { ProjectDetailView } from '@/components/views/project-detail-view'
import { TeamView } from '@/components/views/team-view'
import { SettingsView } from '@/components/views/settings-view'
import { MyTasksView } from '@/components/views/my-tasks-view'
import { CalendarView } from '@/components/views/calendar-view'
import { ReportsView } from '@/components/views/reports-view'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  projects: ProjectsView,
  'project-detail': ProjectDetailView,
  team: TeamView,
  settings: SettingsView,
  'my-tasks': MyTasksView,
  calendar: CalendarView,
  reports: ReportsView,
}

export default function Home() {
  const { currentView } = useAppStore()
  const ViewComponent = viewComponents[currentView] || DashboardView

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-auto p-6">
          <ViewComponent />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
