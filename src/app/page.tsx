'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { PasswordsView } from '@/components/views/passwords-view'
import { LoginView } from '@/components/auth/login-view'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
}

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  projects: ProjectsView,
  'project-detail': ProjectDetailView,
  team: TeamView,
  settings: SettingsView,
  'my-tasks': MyTasksView,
  calendar: CalendarView,
  reports: ReportsView,
  passwords: PasswordsView,
}

export default function Home() {
  const { currentView } = useAppStore()
  const ViewComponent = viewComponents[currentView] || DashboardView
  const [user, setUser] = useState<UserInfo | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/session')
      .then(async (res) => {
        if (!res.ok) return

        const data = await res.json()
        if (!data.authenticated || !data.user || cancelled) return

        setUser(data.user)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Heartbeat: keep session active every 60 seconds
  useEffect(() => {
    if (!user) return
    const heartbeat = setInterval(() => {
      fetch('/api/auth/session').catch(() => {})
    }, 60000)
    return () => clearInterval(heartbeat)
  }, [user])

  const handleLogin = useCallback((userData: UserInfo) => {
    setUser(userData)
  }, [])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    setUser(null)
  }, [])

  // Show loading while checking session
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse" />
          <p className="text-[13px] text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  // Show main app
  return (
    <SidebarProvider>
      <AppSidebar currentUser={user} onLogout={handleLogout} />
      <SidebarInset>
        <AppHeader currentUser={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1440px] p-5 lg:p-8">
            {currentView === 'dashboard' ? (
              <DashboardView currentUser={user} />
            ) : (
              <ViewComponent />
            )}
          </div>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
