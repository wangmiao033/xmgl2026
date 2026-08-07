'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProjectsView } from '@/components/views/projects-view'
import { GameProjectDetailView } from '@/components/views/game-project-detail-view'
import { SettingsView } from '@/components/views/settings-view'
import { PasswordsView } from '@/components/views/passwords-view'
import { LoginView } from '@/components/auth/login-view'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

interface UserInfo {
  id: string
  userId?: string
  email: string
  name: string
  role: string
  avatar: string | null
}

interface LoginUserInfo {
  id?: string
  userId?: string
  email: string
  name: string
  role: string
  avatar: string | null
}

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  projects: ProjectsView,
  'project-detail': GameProjectDetailView,
  settings: SettingsView,
  passwords: PasswordsView,
}

function normalizeUser(user: LoginUserInfo): UserInfo {
  return {
    ...user,
    id: user.id || user.userId || '',
  }
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

        setUser(normalizeUser(data.user))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const heartbeat = setInterval(() => {
      fetch('/api/auth/session').catch(() => {})
    }, 60000)
    return () => clearInterval(heartbeat)
  }, [user])

  const handleLogin = useCallback((userData: LoginUserInfo) => {
    setUser(normalizeUser(userData))
  }, [])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    setUser(null)
  }, [])

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

  if (!user) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar currentUser={user} onLogout={handleLogout} />
      <SidebarInset>
        <AppHeader currentUser={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            {currentView === 'dashboard' ? (
              <DashboardView currentUser={user} />
            ) : currentView === 'project-detail' ? (
              <GameProjectDetailView />
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
