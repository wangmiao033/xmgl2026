import { create } from 'zustand'

export type ViewType = 'dashboard' | 'projects' | 'project-detail' | 'team' | 'settings' | 'my-tasks' | 'calendar' | 'reports'

interface AppState {
  currentView: ViewType
  selectedProjectId: string | null
  sidebarOpen: boolean
  setCurrentView: (view: ViewType) => void
  setSelectedProjectId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  navigateToProject: (projectId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedProjectId: null,
  sidebarOpen: true,
  setCurrentView: (view) => set({ currentView: view, selectedProjectId: view !== 'project-detail' ? null : undefined }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  navigateToProject: (projectId) => set({ currentView: 'project-detail', selectedProjectId: projectId }),
}))
