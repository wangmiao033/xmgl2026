'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ExternalLink,
  Search,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Globe,
  Megaphone,
  Wallet,
  Code2,
  ShieldCheck,
  Palette,
  Calculator,
  Gamepad2,
  Server,
  FileCheck,
  FileText,
  Link,
  Apple,
  FolderPlus,
  ChevronRight,
  LayoutGrid,
  GripVertical,
} from 'lucide-react'

// Dynamic lucide icon mapping
const iconMap: Record<string, React.ElementType> = {
  Megaphone, Wallet, Code2, ShieldCheck, Globe, Palette, Link, Calculator,
  Gamepad2, Server, FileCheck, FileText, Apple, Wrench,
}

const defaultIcon = Globe

// Color configuration
const colorConfig: Record<string, { bg: string; text: string; border: string; light: string; card: string }> = {
  slate:   { bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', light: 'bg-slate-100 dark:bg-slate-800', card: 'bg-slate-50/80 dark:bg-slate-900/40' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', light: 'bg-emerald-100 dark:bg-emerald-900', card: 'bg-emerald-50/80 dark:bg-emerald-900/40' },
  sky:     { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-700', light: 'bg-sky-100 dark:bg-sky-900', card: 'bg-sky-50/80 dark:bg-sky-900/40' },
  amber:   { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', light: 'bg-amber-100 dark:bg-amber-900', card: 'bg-amber-50/80 dark:bg-amber-900/40' },
  red:     { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-700', light: 'bg-red-100 dark:bg-red-900', card: 'bg-red-50/80 dark:bg-red-900/40' },
  violet:  { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-700', light: 'bg-violet-100 dark:bg-violet-900', card: 'bg-violet-50/80 dark:bg-violet-900/40' },
  rose:    { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-700', light: 'bg-rose-100 dark:bg-rose-900', card: 'bg-rose-50/80 dark:bg-rose-900/40' },
  teal:    { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-700', light: 'bg-teal-100 dark:bg-teal-900', card: 'bg-teal-50/80 dark:bg-teal-900/40' },
  orange:  { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-700', light: 'bg-orange-100 dark:bg-orange-900', card: 'bg-orange-50/80 dark:bg-orange-900/40' },
}

interface ToolCategory {
  id: string
  name: string
  icon: string
  color: string
  order: number
  tools: ToolItem[]
}

interface ToolItem {
  id: string
  name: string
  url: string
  description?: string | null
  icon: string
  color: string
  order: number
  categoryId: string
}

const iconOptions = [
  { value: 'Globe', label: 'Globe' },
  { value: 'Link', label: 'Link' },
  { value: 'Megaphone', label: 'Megaphone' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Code2', label: 'Code2' },
  { value: 'ShieldCheck', label: 'ShieldCheck' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Calculator', label: 'Calculator' },
  { value: 'Gamepad2', label: 'Gamepad2' },
  { value: 'Server', label: 'Server' },
  { value: 'FileCheck', label: 'FileCheck' },
  { value: 'FileText', label: 'FileText' },
  { value: 'Apple', label: 'Apple' },
  { value: 'Wrench', label: 'Wrench' },
  { value: 'LayoutGrid', label: 'LayoutGrid' },
]

const colorOptions = [
  { value: 'slate', label: '石墨' },
  { value: 'emerald', label: '翡翠' },
  { value: 'sky', label: '天蓝' },
  { value: 'amber', label: '琥珀' },
  { value: 'red', label: '红色' },
  { value: 'violet', label: '紫色' },
  { value: 'rose', label: '玫瑰' },
  { value: 'teal', label: '青色' },
  { value: 'orange', label: '橙色' },
]

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || defaultIcon
  return <Icon className={className} />
}

function ToolCard({ tool, onEdit, onDelete }: { tool: ToolItem; onEdit: (t: ToolItem) => void; onDelete: (id: string) => void }) {
  const colors = colorConfig[tool.color] || colorConfig.slate
  const Icon = iconMap[tool.icon] || defaultIcon

  // Extract domain for display
  let domain = ''
  try { domain = new URL(tool.url).hostname.replace('www.', '') } catch { domain = tool.url }

  return (
    <div className="group relative rounded-xl border border-border/40 bg-card shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="block p-4">
        <div className="flex items-start gap-3.5">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-sm', colors.light)}>
            <ToolIcon name={tool.icon} className={cn('h-5 w-5', colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold truncate group-hover:text-primary transition-colors">{tool.name}</h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[12px] text-muted-foreground/60 truncate mt-0.5">{domain}</p>
            {tool.description && (
              <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{tool.description}</p>
            )}
          </div>
        </div>
      </a>
      {/* Edit/Delete buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(tool) }}
          className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border/60 shadow-sm hover:bg-muted transition-colors"
        >
          <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center border border-border/60 shadow-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除工具</AlertDialogTitle>
              <AlertDialogDescription>确定要删除工具「{tool.name}」吗？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(tool.id)} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function ToolboxView({ currentUser }: { currentUser?: { role: string } | null }) {
  const [categories, setCategories] = useState<ToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Tool dialog state
  const [toolDialogOpen, setToolDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null)
  const [toolForm, setToolForm] = useState({ name: '', url: '', description: '', icon: 'Globe', color: 'slate', categoryId: '' })

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', icon: 'Link', color: 'slate' })

  const initializedRef = useRef(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/tool-categories')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
        // Only auto-select first category on initial load
        if (!initializedRef.current && data.length > 0) {
          setActiveCategory(data[0].id)
          initializedRef.current = true
        }
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [refreshKey, fetchCategories])

  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0)

  // Filter tools by search and category
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter((tool) => {
        const matchesCat = !activeCategory || cat.id === activeCategory
        const matchesSearch = !search.trim() ||
          tool.name.toLowerCase().includes(search.toLowerCase()) ||
          tool.description?.toLowerCase().includes(search.toLowerCase()) ||
          tool.url.toLowerCase().includes(search.toLowerCase())
        return matchesCat && matchesSearch
      }),
    }))
    .filter((cat) => cat.tools.length > 0 || !activeCategory)

  const displayedCategories = activeCategory
    ? filteredCategories.filter((c) => c.id === activeCategory)
    : filteredCategories

  // Tool CRUD
  const openToolDialog = (tool?: ToolItem) => {
    if (tool) {
      setEditingTool(tool)
      setToolForm({ name: tool.name, url: tool.url, description: tool.description || '', icon: tool.icon, color: tool.color, categoryId: tool.categoryId })
    } else {
      setEditingTool(null)
      setToolForm({ name: '', url: '', description: '', icon: 'Globe', color: 'slate', categoryId: activeCategory || (categories[0]?.id || '') })
    }
    setToolDialogOpen(true)
  }

  const handleSaveTool = async () => {
    if (!toolForm.name.trim() || !toolForm.url.trim() || !toolForm.categoryId) {
      toast.error('请填写名称、链接和分类')
      return
    }
    try {
      const url = editingTool ? `/api/tools/${editingTool.id}` : '/api/tools'
      const method = editingTool ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolForm),
      })
      if (res.ok) {
        toast.success(editingTool ? '工具已更新' : '工具已添加')
        setToolDialogOpen(false)
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDeleteTool = async (id: string) => {
    try {
      const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('工具已删除')
        setRefreshKey((k) => k + 1)
      } else {
        toast.error('删除失败，请重试')
      }
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  // Category CRUD
  const handleSaveCat = async () => {
    if (!catForm.name.trim()) { toast.error('请输入分类名称'); return }
    try {
      const res = await fetch('/api/tool-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm),
      })
      if (res.ok) {
        toast.success('分类已创建')
        setCatDialogOpen(false)
        setCatForm({ name: '', icon: 'Link', color: 'slate' })
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('创建失败')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/tool-categories/${id}`, { method: 'DELETE' })
      toast.success('分类已删除')
      if (activeCategory === id) setActiveCategory(null)
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error('删除失败')
    }
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">工具箱</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            快捷访问常用工具和网站，共 {totalTools} 个工具
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCatDialogOpen(true)} variant="outline" size="sm" className="text-[13px]">
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />新建分类
          </Button>
          <Button onClick={() => openToolDialog()} size="sm" className="text-[13px]">
            <Plus className="h-3.5 w-3.5 mr-1.5" />添加工具
          </Button>
        </div>
      </div>

      {/* Search + Category Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row p-3.5 rounded-xl bg-card/80 border border-border/40 shadow-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="搜索工具名称、描述、网址..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background/80 border-border/50 focus:border-emerald-400 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all',
            !activeCategory
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          全部
          <span className={cn(
            'text-[11px] px-1.5 py-0.5 rounded-md font-semibold',
            !activeCategory ? 'bg-white/20' : 'bg-muted'
          )}>
            {totalTools}
          </span>
        </button>
        {categories.map((cat) => {
          const colors = colorConfig[cat.color] || colorConfig.slate
          return (
            <div key={cat.id} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.id
                    ? cn(colors.bg, 'text-white shadow-sm')
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <ToolIcon name={cat.icon} className="h-3.5 w-3.5" />
                {cat.name}
                <span className={cn(
                  'text-[11px] px-1.5 py-0.5 rounded-md font-semibold',
                  activeCategory === cat.id ? 'bg-white/20' : 'bg-muted'
                )}>
                  {cat.tools.length}
                </span>
              </button>
              {isAdmin && activeCategory === cat.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>删除分类</AlertDialogTitle>
                      <AlertDialogDescription>
                        删除「{cat.name}」分类将同时删除该分类下的 {cat.tools.length} 个工具，此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      ) : displayedCategories.length === 0 || displayedCategories.every((c) => c.tools.length === 0) ? (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mx-auto mb-5">
            <Wrench className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-[16px] font-semibold">{search ? '未找到匹配的工具' : '暂无工具'}</p>
          <p className="text-[14px] text-muted-foreground mt-1.5">
            {search ? '尝试调整搜索关键词' : '点击「添加工具」开始收藏常用网站'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedCategories.map((cat) => {
            const catColors = colorConfig[cat.color] || colorConfig.slate
            return (
              <div key={cat.id}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shadow-sm', catColors.light)}>
                    <ToolIcon name={cat.icon} className={cn('h-4 w-4', catColors.text)} />
                  </div>
                  <h2 className="text-[16px] font-semibold">{cat.name}</h2>
                  <span className="text-[12px] text-muted-foreground">{cat.tools.length} 个工具</span>
                  <div className={cn('flex-1 h-px', catColors.border, 'border-t border-dashed opacity-40')} />
                </div>
                {/* Tool cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onEdit={openToolDialog}
                      onDelete={handleDeleteTool}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Tool Dialog */}
      <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTool ? '编辑工具' : '添加工具'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">名称 *</label>
              <Input
                placeholder="如：TapTap 开发者"
                value={toolForm.name}
                onChange={(e) => setToolForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">链接 *</label>
              <Input
                placeholder="https://..."
                value={toolForm.url}
                onChange={(e) => setToolForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">描述</label>
              <Textarea
                placeholder="简短描述这个工具的用途"
                value={toolForm.description}
                onChange={(e) => setToolForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium">图标</label>
                <Select value={toolForm.icon} onValueChange={(v) => setToolForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <ToolIcon name={opt.value} className="h-4 w-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">颜色</label>
                <Select value={toolForm.color} onValueChange={(v) => setToolForm((f) => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', `bg-${opt.value}-500`)} />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">分类 *</label>
              <Select value={toolForm.categoryId} onValueChange={(v) => setToolForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <ToolIcon name={cat.icon} className="h-4 w-4" />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Preview */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium">预览</label>
              <div className="rounded-lg border border-border/40 p-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', (colorConfig[toolForm.color] || colorConfig.slate).light)}>
                    <ToolIcon name={toolForm.icon} className={cn('h-5 w-5', (colorConfig[toolForm.color] || colorConfig.slate).text)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate">{toolForm.name || '工具名称'}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{toolForm.url || 'https://...'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToolDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveTool}>{editingTool ? '保存' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">分类名称 *</label>
              <Input
                placeholder="如：运营平台"
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium">图标</label>
                <Select value={catForm.icon} onValueChange={(v) => setCatForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <ToolIcon name={opt.value} className="h-4 w-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">颜色</label>
                <Select value={catForm.color} onValueChange={(v) => setCatForm((f) => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', `bg-${opt.value}-500`)} />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveCat}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
