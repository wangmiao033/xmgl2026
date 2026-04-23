'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  User,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Star,
  CalendarDays,
  Shield,
  Globe,
  ChevronUp,
  ChevronDown,
  Building2,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PasswordEntry {
  id: string
  title: string
  url?: string | null
  username?: string | null
  password: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  category: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

const categoryConfig: Record<string, { label: string; color: string; bg: string; darkBg: string; dot: string }> = {
  channel: { label: '渠道', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50', darkBg: 'dark:bg-teal-500/10', dot: 'bg-teal-500' },
  website: { label: '网站', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-500/10', dot: 'bg-blue-500' },
  game: { label: '游戏', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-500/10', dot: 'bg-violet-500' },
  tool: { label: '工具', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-500/10', dot: 'bg-amber-500' },
  server: { label: '服务器', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50', darkBg: 'dark:bg-red-500/10', dot: 'bg-red-500' },
  social: { label: '社交', color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-50', darkBg: 'dark:bg-pink-500/10', dot: 'bg-pink-500' },
  other: { label: '其他', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50', darkBg: 'dark:bg-slate-500/10', dot: 'bg-slate-400' },
}

export function PasswordsView() {
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sortField, setSortField] = useState<'title' | 'category' | 'updatedAt'>('category')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formCategory, setFormCategory] = useState('other')

  // Expanded row for notes
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchEntries = useCallback(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    fetch(`/api/passwords?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
            if (sortField === 'title') {
              return sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
            }
            if (sortField === 'category') {
              return sortDir === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
            }
            return sortDir === 'asc'
              ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
              : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          })
          setEntries(sorted)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [search, categoryFilter, refreshKey, sortField, sortDir])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const resetForm = () => {
    setFormTitle(''); setFormUrl(''); setFormUsername(''); setFormPassword('')
    setFormEmail(''); setFormPhone(''); setFormNotes(''); setFormCategory('other')
    setEditMode(false); setEditId(null)
  }

  const openCreateDialog = () => { resetForm(); setDialogOpen(true) }

  const openEditDialog = (entry: PasswordEntry) => {
    setEditMode(true); setEditId(entry.id)
    setFormTitle(entry.title); setFormUrl(entry.url || ''); setFormUsername(entry.username || '')
    setFormPassword(entry.password); setFormEmail(entry.email || ''); setFormPhone(entry.phone || '')
    setFormNotes(entry.notes || ''); setFormCategory(entry.category)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formPassword.trim()) return
    setSubmitLoading(true)
    try {
      const body = {
        title: formTitle.trim(), url: formUrl.trim() || null, username: formUsername.trim() || null,
        password: formPassword.trim(), email: formEmail.trim() || null, phone: formPhone.trim() || null,
        notes: formNotes.trim() || null, category: formCategory,
      }
      const url = editMode && editId ? `/api/passwords/${editId}` : '/api/passwords'
      const res = await fetch(url, { method: editMode ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editMode ? '密码已更新' : '密码已添加'); setDialogOpen(false); resetForm(); setRefreshKey((k) => k + 1) }
    } catch (error) { console.error('Error saving password:', error) } finally { setSubmitLoading(false) }
  }

  const handleDelete = async (id: string) => {
    try { const res = await fetch(`/api/passwords/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('密码已删除'); setRefreshKey((k) => k + 1) } } catch (error) { console.error(error) }
  }

  const toggleFavorite = async (entry: PasswordEntry) => {
    try { const res = await fetch(`/api/passwords/${entry.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: !entry.isFavorite }) }); if (res.ok) setRefreshKey((k) => k + 1) } catch (error) { console.error(error) }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label}已复制`)).catch(() => toast.error('复制失败'))
  }

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) } catch { return dateStr }
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  const favoriteCount = entries.filter(e => e.isFavorite).length

  // Group entries by category for stats
  const categoryCounts = entries.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc }, {})

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5 animate-fade-in">

        {/* ===== HEADER ===== */}
        <div className="rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-card">
          <div className="p-5 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">账号密码登记表</h1>
                  <p className="text-[13px] text-muted-foreground mt-0.5">Account Password Registry</p>
                </div>
              </div>
              <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 px-4 text-[13px]">
                <Plus className="mr-1.5 h-4 w-4" />新增记录
              </Button>
            </div>
          </div>

          {/* Stats summary bar */}
          <div className="px-5 pb-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <span className="text-muted-foreground">
                账号数量 <span className="font-bold text-foreground text-[15px] mx-0.5">{entries.length}</span>
              </span>
              {favoriteCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-500" />收藏 {favoriteCount}
                </span>
              )}
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const cfg = categoryConfig[cat]
                return cfg ? (
                  <span key={cat} className="flex items-center gap-1.5">
                    <span className={cn('inline-block h-2 w-2 rounded-full', cfg.dot)} />
                    <span className="text-muted-foreground">{cfg.label}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </span>
                ) : null
              })}
            </div>
          </div>

          {/* Search + Filter bar */}
          <div className="border-t border-border/40 px-5 py-3 bg-muted/20">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="搜索名称、网址、账号、备注..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-[13px] bg-background border-border/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-[13px] bg-background border-border/40">
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="channel">渠道</SelectItem>
                    <SelectItem value="website">网站</SelectItem>
                    <SelectItem value="game">游戏</SelectItem>
                    <SelectItem value="tool">工具</SelectItem>
                    <SelectItem value="server">服务器</SelectItem>
                    <SelectItem value="social">社交</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-8 px-3 text-[13px] border-border/40 transition-all',
                        showAllPasswords
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                          : ''
                      )}
                      onClick={() => setShowAllPasswords(!showAllPasswords)}
                    >
                      {showAllPasswords ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                      {showAllPasswords ? '隐藏密码' : '显示密码'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showAllPasswords ? '点击隐藏所有密码' : '点击显示所有密码'}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60 bg-card/50">
            <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-muted-foreground">暂无匹配的密码记录</p>
            <p className="text-[13px] text-muted-foreground/60 mt-1">尝试调整搜索条件或添加新记录</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-card overflow-hidden animate-slide-up">
            {/* Table container with horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                {/* Table Header - Teal */}
                <thead>
                  <tr className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                    <th className="py-2.5 px-3 text-left font-semibold w-8 text-center">#</th>
                    <th
                      className={cn('py-2.5 px-3 text-left font-semibold cursor-pointer select-none min-w-[140px] hover:bg-teal-500/80 transition-colors')}
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        分类
                        {sortField === 'category' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-3 text-left font-semibold min-w-[160px] cursor-pointer select-none hover:bg-teal-500/80 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        渠道名称
                        {sortField === 'title' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-left font-semibold min-w-[180px]">网址</th>
                    <th className="py-2.5 px-3 text-left font-semibold min-w-[140px]">账号</th>
                    <th className="py-2.5 px-3 text-left font-semibold min-w-[130px]">密码</th>
                    <th className="py-2.5 px-3 text-left font-semibold min-w-[120px]">主体/备注</th>
                    <th
                      className="py-2.5 px-3 text-left font-semibold min-w-[90px] cursor-pointer select-none hover:bg-teal-500/80 transition-colors"
                      onClick={() => handleSort('updatedAt')}
                    >
                      <div className="flex items-center gap-1">
                        更新日期
                        {sortField === 'updatedAt' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center font-semibold w-[100px]">操作</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry, index) => {
                    const cat = categoryConfig[entry.category] || categoryConfig.other
                    const isEven = index % 2 === 0
                    const hasNotes = entry.notes && entry.notes.length > 0
                    const isExpanded = expandedRow === entry.id

                    return (
                      <Fragment key={entry.id}>
                      <tr
                        className={cn(
                          'group border-b border-border/25 transition-colors',
                          isEven ? 'bg-white dark:bg-card' : 'bg-slate-50/70 dark:bg-card/60',
                          entry.isFavorite && 'bg-amber-30/50 dark:bg-amber-500/5',
                          'hover:bg-teal-50/60 dark:hover:bg-teal-500/5',
                          isExpanded && 'bg-teal-50/40 dark:bg-teal-500/5'
                        )}
                      >
                        {/* Row number */}
                        <td className="py-2 px-3 text-center text-muted-foreground/50 font-mono text-[12px]">
                          {index + 1}
                        </td>

                        {/* Category */}
                        <td className="py-2 px-3">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                            cat.bg, cat.darkBg, cat.color
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', cat.dot)} />
                            {cat.label}
                          </span>
                        </td>

                        {/* Title + Favorite */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => toggleFavorite(entry)}
                                  className="shrink-0 transition-colors"
                                >
                                  <Star className={cn(
                                    'h-3.5 w-3.5 transition-colors',
                                    entry.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-transparent hover:text-amber-300 hover:fill-amber-300'
                                  )} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{entry.isFavorite ? '取消收藏' : '收藏'}</TooltipContent>
                            </Tooltip>
                            <span className="font-medium text-foreground truncate max-w-[180px]">{entry.title}</span>
                          </div>
                        </td>

                        {/* URL */}
                        <td className="py-2 px-3">
                          {entry.url ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[180px] transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{entry.url.replace(/^https?:\/\//, '').substring(0, 35)}{entry.url.length > 50 ? '...' : ''}</span>
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>{entry.url}</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        {/* Username */}
                        <td className="py-2 px-3">
                          {entry.username ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="truncate text-foreground/80 max-w-[130px]">{entry.username}</span>
                              <button
                                onClick={() => copyToClipboard(entry.username || '', '账号')}
                                className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        {/* Password */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1 min-w-0">
                            <KeyRound className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            <span className={cn(
                              'font-mono text-[12px] tracking-wide truncate max-w-[100px]',
                              showAllPasswords ? 'text-foreground/80' : 'text-muted-foreground/50'
                            )}>
                              {showAllPasswords ? entry.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => copyToClipboard(entry.password, '密码')}
                              className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                            </button>
                          </div>
                        </td>

                        {/* Notes (entity info) */}
                        <td className="py-2 px-3">
                          {hasNotes ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                              className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground transition-colors text-left max-w-[120px]"
                            >
                              <span className="truncate text-[12px]">{entry.notes!.substring(0, 20)}{entry.notes!.length > 20 ? '...' : ''}</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        {/* Update Date */}
                        <td className="py-2 px-3 text-muted-foreground whitespace-nowrap text-[12px]">
                          {formatDate(entry.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openEditDialog(entry)}
                                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-600" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>删除</TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>确定要删除 "{entry.title}" 的密码记录吗？此操作不可撤销。</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-red-600 hover:bg-red-700 text-white">删除</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded notes row */}
                      {isExpanded && hasNotes ? (
                        <tr className="bg-teal-50/40 dark:bg-teal-500/5">
                          <td colSpan={9} className="px-6 py-3">
                            <div className="flex items-start gap-2 text-[13px] animate-fade-in">
                              <span className="text-muted-foreground shrink-0 mt-0.5 font-medium">备注:</span>
                              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="border-t border-border/30 px-5 py-2.5 bg-muted/20 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>共 {entries.length} 条记录</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 收藏
                </span>
                <span>密码已{showAllPasswords ? '显示' : '隐藏'}</span>
              </span>
            </div>
          </div>
        )}

        {/* ===== CREATE/EDIT DIALOG ===== */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {editMode ? '编辑密码' : '新增密码记录'}
              </DialogTitle>
              <DialogDescription>
                {editMode ? '修改密码信息' : '填写账号密码信息并保存'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="pw-title" className="text-[13px]">渠道名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="pw-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="例如：华为开发者平台"
                    required
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="pw-category" className="text-[13px]">分类</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="channel">渠道</SelectItem>
                      <SelectItem value="website">网站</SelectItem>
                      <SelectItem value="game">游戏</SelectItem>
                      <SelectItem value="tool">工具</SelectItem>
                      <SelectItem value="server">服务器</SelectItem>
                      <SelectItem value="social">社交</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pw-url" className="text-[13px]">登录链接</Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="pw-url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-8 h-9 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pw-username" className="text-[13px]">账号</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-username"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="用户名或账号"
                      className="pl-8 h-9 text-[13px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-password" className="text-[13px]">密码 <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="输入密码"
                      required
                      className="pl-8 pr-8 h-9 text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('pw-password') as HTMLInputElement
                        input.type = input.type === 'password' ? 'text' : 'password'
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pw-email" className="text-[13px]">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="关联邮箱"
                      className="pl-8 h-9 text-[13px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-phone" className="text-[13px]">手机号</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-phone"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="关联手机号"
                      className="pl-8 h-9 text-[13px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pw-notes" className="text-[13px]">备注</Label>
                <Textarea
                  id="pw-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="添加备注信息..."
                  rows={2}
                  className="resize-none text-[13px]"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }} className="h-9 text-[13px]">
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitLoading || !formTitle.trim() || !formPassword.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-[13px]"
                >
                  {submitLoading ? '保存中...' : editMode ? '保存修改' : '添加'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
