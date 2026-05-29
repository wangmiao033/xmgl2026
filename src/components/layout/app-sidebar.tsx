'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore, type ViewType } from '@/stores/app-store'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  FileText,
  Search,
  X,
  KeyRound,
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
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navItems: { title: string; icon: React.ElementType; view: ViewType }[] = [
  { title: '仪表板', icon: LayoutDashboard, view: 'dashboard' },
  { title: '项目列表', icon: FolderKanban, view: 'projects' },
  { title: '密码管理', icon: KeyRound, view: 'passwords' },
]

interface QuickProject {
  id: string
  name: string
  docUrl?: string | null
  docName?: string | null
}

interface SearchResult {
  type: 'project' | 'task'
  id: string
  projectId?: string
  title: string
  subtitle?: string
}

export function AppSidebar({ currentUser, onLogout }: { currentUser?: { name: string; role: string; email: string } | null; onLogout?: () => void }) {
  const { currentView, setCurrentView, navigateToProject } = useAppStore()
  const [recentProjects, setRecentProjects] = useState<QuickProject[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects?limit=5')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setRecentProjects(data.slice(0, 5))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const effectiveResults = !searchQuery.trim() ? [] : searchResults

  useEffect(() => {
    if (!searchQuery.trim()) return
    const timer = setTimeout(async () => {
      try {
        const projectsRes = await fetch('/api/projects')
        const projects = await projectsRes.json()
        const query = searchQuery.toLowerCase()
        const results: SearchResult[] = []
        for (const p of projects) {
          if (p.name.toLowerCase().includes(query)) {
            results.push({ type: 'project', id: p.id, title: p.name, subtitle: '项目' })
          }
          if (p.tasks) {
            for (const t of p.tasks) {
              if (t.title.toLowerCase().includes(query)) {
                results.push({ type: 'task', id: t.id, projectId: p.id, title: t.title, subtitle: `任务 · ${p.name}` })
              }
            }
          }
        }
        setSearchResults(results.slice(0, 8))
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'project') {
      navigateToProject(result.id)
    } else if (result.projectId) {
      navigateToProject(result.projectId)
    }
    setSearchQuery('')
    setShowSearch(false)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarRail />
      {/* Background with animated gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pointer-events-none overflow-hidden">
        {/* Animated gradient mesh circles */}
        <div
          className="absolute -top-20 -left-10 w-60 h-60 rounded-full bg-emerald-500/[0.07] blur-3xl pointer-events-none"
          style={{ animation: 'sidebarMesh1 12s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute top-1/3 -right-16 w-52 h-52 rounded-full bg-teal-500/[0.05] blur-3xl pointer-events-none"
          style={{ animation: 'sidebarMesh2 15s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute bottom-20 left-4 w-40 h-40 rounded-full bg-emerald-400/[0.04] blur-3xl pointer-events-none"
          style={{ animation: 'sidebarMesh3 18s ease-in-out infinite alternate' }}
        />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400/60 via-emerald-500/30 to-transparent" />
      </div>

      <SidebarHeader className="p-5 relative">
        <div className="flex items-center gap-3 px-1">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-sm shadow-glow-emerald',
            'ring-2 ring-emerald-400/20 animate-pulse-glow'
          )}>
            PM
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #86efac 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              项目管理
            </span>
            <span
              className="text-[11px] text-slate-500 mt-0.5"
              style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
            >
              企业内部管理系统
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="relative">
        {/* Search */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div ref={searchRef} className="relative px-3">
            <div className="relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 transition-transform duration-300',
                searchFocused && 'rotate-12 scale-110 text-emerald-400'
              )} />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearch(true)
                }}
                onFocus={() => { setShowSearch(true); setSearchFocused(true) }}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  'w-full rounded-lg bg-white/[0.06] border border-white/[0.08] py-2 pl-9 pr-8 text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all duration-300',
                  'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); inputRef.current?.focus() }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showSearch && searchQuery.trim() && (
              <div className="absolute top-full left-3 right-3 mt-1.5 z-50 rounded-xl backdrop-blur-xl bg-slate-800/90 border border-white/[0.08] shadow-float max-h-64 overflow-y-auto animate-slide-down">
                {effectiveResults.length > 0 ? (
                  <div className="py-1.5">
                    {effectiveResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchSelect(result)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.08] transition-all duration-200',
                        )}
                        style={{ animation: `fadeIn 0.2s ease-out ${index * 0.04}s both` }}
                      >
                        {result.type === 'project' ? (
                          <FolderKanban className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <CheckSquare className="h-4 w-4 text-sky-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-slate-200 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{result.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center text-[13px] text-slate-500">未找到匹配结果</div>
                )}
              </div>
            )}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 px-4 text-[11px] uppercase tracking-wider font-medium">导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                    tooltip={item.title}
                    className={cn(
                      'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 rounded-lg mx-1 relative transition-all duration-200',
                      'data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500/10 data-[active=true]:to-transparent data-[active=true]:text-emerald-400 data-[active=true]:font-medium',
                      'data-[active=true]:[text-shadow:0_0_8px_rgba(52,211,153,0.3)]',
                      'group'
                    )}
                  >
                    {currentView === item.view && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] origin-y"
                        style={{ animation: 'scaleInY 0.2s ease-out both' }}
                      />
                    )}
                    <item.icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-[13px]">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/[0.06] mx-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 px-4 text-[11px] uppercase tracking-wider font-medium">快捷入口</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 固定文档链接 */}
              <SidebarMenuItem>
                <a
                  href="https://www.kdocs.cn/l/cfxrznQtnWtC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg p-2 text-left outline-hidden transition-all duration-200 hover:bg-white/[0.08] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!',
                    'text-slate-400 hover:text-emerald-400 group'
                  )}
                  title="六界飞仙0.1 折版本进度表"
                >
                  <FileText className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ animation: 'iconPulse 3s ease-in-out infinite' }} />
                  <span className="truncate text-[13px] group-data-[collapsible=icon]:hidden">六界飞仙0.1折版本进度表</span>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a
                  href="https://www.kdocs.cn/l/ch4uK6S7JoiY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg p-2 text-left outline-hidden transition-all duration-200 hover:bg-white/[0.08] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!',
                    'text-slate-400 hover:text-emerald-400 group'
                  )}
                  title="帝国雄狮常规婚服版本进度表"
                >
                  <FileText className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ animation: 'iconPulse 3s ease-in-out infinite' }} />
                  <span className="truncate text-[13px] group-data-[collapsible=icon]:hidden">帝国雄狮常规婚服版本进度表</span>
                </a>
              </SidebarMenuItem>
              {recentProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    {project.docUrl ? (
                      <a
                        href={project.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg p-2 text-left outline-hidden transition-all duration-200 hover:bg-white/[0.08] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!',
                          'text-slate-400 hover:text-emerald-400 group'
                        )}
                        title={`打开 ${project.docName || project.name}`}
                      >
                        <FileText className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ animation: 'iconPulse 3s ease-in-out infinite' }} />
                        <span className="truncate text-[13px] group-data-[collapsible=icon]:hidden">
                          {project.docName || project.name}
                        </span>
                      </a>
                    ) : (
                      <SidebarMenuButton
                        onClick={() => navigateToProject(project.id)}
                        tooltip={project.name}
                        className="text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] rounded-lg mx-1 transition-all duration-200"
                      >
                        <FolderKanban className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-[13px] truncate">{project.name}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 relative">
        <button
          onClick={() => setCurrentView('settings')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 hover:-translate-y-0.5',
            currentView === 'settings'
              ? 'bg-white/[0.08] shadow-[0_0_12px_rgba(16,185,129,0.08)]'
              : 'hover:bg-white/[0.04]'
          )}
        >
          <Avatar className="h-9 w-9 ring-2 ring-emerald-500/30 shadow-glow-emerald">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 text-sm font-medium">
              {currentUser?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
              {currentUser?.name || '用户'}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </span>
            <span className="text-[11px] text-slate-500">{currentUser?.role === 'admin' ? '管理员' : currentUser?.role === 'manager' ? '经理' : '成员'}</span>
          </div>
          <Settings className={cn(
            'h-4 w-4 shrink-0 transition-colors group-data-[collapsible=icon]:hidden',
            currentView === 'settings' ? 'text-emerald-400' : 'text-slate-500'
          )} />
        </button>
      </SidebarFooter>

      {/* Inline keyframes for sidebar animations */}
      <style jsx>{`
        @keyframes sidebarMesh1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 40px) scale(1.15); }
        }
        @keyframes sidebarMesh2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-25px, -30px) scale(1.1); }
        }
        @keyframes sidebarMesh3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -20px) scale(1.2); }
        }
        @keyframes scaleInY {
          0% { transform: translateY(-50%) scaleY(0); opacity: 0; }
          100% { transform: translateY(-50%) scaleY(1); opacity: 1; }
        }
        @keyframes iconPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </Sidebar>
  )
}
