'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProjectsView } from '@/components/views/projects-view'
import { GameProjectDetailView } from '@/components/views/game-project-detail-view'
import { DocumentsCenterView } from '@/components/views/documents-center-view'
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
  documents: DocumentsCenterView,
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
    fetch('/api/auth/session')
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (data.authenticated && data.user) setUser(normalizeUser(data.user))
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = useCallback((userData: LoginUserInfo) => {
    setUser(normalizeUser(userData))
  }, [])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    setUser(null)
  }, [])

  if (checking) return <div className="min-h-screen flex items-center justify-center">加载中...</div>

  if (!user) {
    return <><LoginView onLogin={handleLogin} /><Toaster /></>
  }

  return (
    <SidebarProvider>
      <AppSidebar currentUser={user} onLogout={handleLogout} />
      <SidebarInset>
        <AppHeader currentUser={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            {currentView === 'dashboard' ? <DashboardView currentUser={user} /> : <ViewComponent />}
          </div>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
