'use client'

import { useEffect, useState, useCallback } from 'react'
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
  FileText,
  Filter,
  Shield,
  Globe,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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

const categoryConfig: Record<string, { label: string; tagClass: string; iconBg: string; iconColor: string }> = {
  channel: { label: '渠道', tagClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400', iconBg: 'from-teal-500/15 to-teal-500/5', iconColor: 'text-teal-600 dark:text-teal-400' },
  website: { label: '网站', tagClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', iconBg: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-600 dark:text-blue-400' },
  game: { label: '游戏', tagClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400', iconBg: 'from-violet-500/15 to-violet-500/5', iconColor: 'text-violet-600 dark:text-violet-400' },
  tool: { label: '工具', tagClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', iconBg: 'from-amber-500/15 to-amber-500/5', iconColor: 'text-amber-600 dark:text-amber-400' },
  server: { label: '服务器', tagClass: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', iconBg: 'from-red-500/15 to-red-500/5', iconColor: 'text-red-600 dark:text-red-400' },
  social: { label: '社交', tagClass: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400', iconBg: 'from-pink-500/15 to-pink-500/5', iconColor: 'text-pink-600 dark:text-pink-400' },
  other: { label: '其他', tagClass: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400', iconBg: 'from-slate-500/15 to-slate-500/5', iconColor: 'text-slate-600 dark:text-slate-400' },
}

export function PasswordsView() {
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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
          // Sort: favorites first, then by updatedAt desc
          const sorted = [...data].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          })
          setEntries(sorted)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [search, categoryFilter, refreshKey])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const resetForm = () => {
    setFormTitle('')
    setFormUrl('')
    setFormUsername('')
    setFormPassword('')
    setFormEmail('')
    setFormPhone('')
    setFormNotes('')
    setFormCategory('other')
    setEditMode(false)
    setEditId(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (entry: PasswordEntry) => {
    setEditMode(true)
    setEditId(entry.id)
    setFormTitle(entry.title)
    setFormUrl(entry.url || '')
    setFormUsername(entry.username || '')
    setFormPassword(entry.password)
    setFormEmail(entry.email || '')
    setFormPhone(entry.phone || '')
    setFormNotes(entry.notes || '')
    setFormCategory(entry.category)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formPassword.trim()) return

    setSubmitLoading(true)
    try {
      const body = {
        title: formTitle.trim(),
        url: formUrl.trim() || null,
        username: formUsername.trim() || null,
        password: formPassword.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        notes: formNotes.trim() || null,
        category: formCategory,
      }

      const url = editMode && editId
        ? `/api/passwords/${editId}`
        : '/api/passwords'

      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editMode ? '密码已更新' : '密码已添加')
        setDialogOpen(false)
        resetForm()
        setRefreshKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Error saving password:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/passwords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('密码已删除')
        setRefreshKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Error deleting password:', error)
    }
  }

  const toggleFavorite = async (entry: PasswordEntry) => {
    try {
      const res = await fetch(`/api/passwords/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !entry.isFavorite }),
      })
      if (res.ok) {
        setRefreshKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label}已复制`)
    }).catch(() => {
      toast.error('复制失败')
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const favoriteCount = entries.filter(e => e.isFavorite).length

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">密码管理</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              安全存储和管理团队账号密码信息
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10 px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加密码
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center p-3.5 rounded-xl bg-card/80 border border-border/40 shadow-card">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder="搜索名称、网址、账号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background/80 border-border/50 focus:border-emerald-400 focus:ring-emerald-400/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground/70 shrink-0" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 bg-background/80 border-border/50">
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
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 px-3.5 text-[13px] border-border/50 transition-all',
                showAllPasswords
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'hover:border-emerald-200 dark:hover:border-emerald-800'
              )}
              onClick={() => setShowAllPasswords(!showAllPasswords)}
            >
              {showAllPasswords ? (
                <><EyeOff className="mr-1.5 h-3.5 w-3.5" />隐藏密码</>
              ) : (
                <><Eye className="mr-1.5 h-3.5 w-3.5" />显示密码</>
              )}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && entries.length > 0 && (
          <div className="flex items-center gap-4 px-1">
            <span className="text-[13px] text-muted-foreground">
              共 <span className="font-semibold text-foreground">{entries.length}</span> 条记录
            </span>
            {favoriteCount > 0 && (
              <div className="h-3 w-px bg-border/60" />
            )}
            {favoriteCount > 0 && (
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-amber-600 dark:text-amber-400">{favoriteCount}</span> 个收藏
              </span>
            )}
          </div>
        )}

        {/* Cards Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 mx-auto mb-5 shadow-sm">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-[16px] font-semibold">暂无密码记录</p>
            <p className="text-[14px] text-muted-foreground mt-1.5">点击上方按钮添加第一条密码记录</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry, index) => {
              const cat = categoryConfig[entry.category] || categoryConfig.other
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'group relative rounded-xl border bg-card shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-slide-up',
                    entry.isFavorite
                      ? 'border-amber-200/60 dark:border-amber-500/20 shadow-glow-amber'
                      : 'border-border/40'
                  )}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Category accent */}
                  <div className={cn('absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r',
                    entry.category === 'channel' && 'from-teal-400 to-teal-500',
                    entry.category === 'website' && 'from-blue-400 to-blue-500',
                    entry.category === 'game' && 'from-violet-400 to-violet-500',
                    entry.category === 'tool' && 'from-amber-400 to-amber-500',
                    entry.category === 'server' && 'from-red-400 to-red-500',
                    entry.category === 'social' && 'from-pink-400 to-pink-500',
                    entry.category === 'other' && 'from-slate-300 to-slate-400',
                  )} />

                  <div className="p-5 pt-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shrink-0 shadow-sm',
                          cat.iconBg
                        )}>
                          <Globe className={cn('h-4 w-4', cat.iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-semibold truncate leading-tight">{entry.title}</h3>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mt-1', cat.tagClass)}>
                            {cat.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleFavorite(entry)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                        >
                          <Star className={cn('h-4 w-4 transition-colors',
                            entry.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                          )} />
                        </button>
                        <div className="relative">
                          <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info Rows */}
                    <div className="space-y-2.5">
                      {/* Username */}
                      {(entry.username || entry.email) && (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-[13px] truncate text-foreground/80 flex-1">{entry.username || entry.email}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(entry.username || entry.email || '', '账号')}
                                className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>复制账号</p></TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Password */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span className={cn(
                          'text-[13px] truncate font-mono flex-1 tracking-wider',
                          showAllPasswords ? 'text-foreground/80' : 'text-muted-foreground'
                        )}>
                          {showAllPasswords ? entry.password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => copyToClipboard(entry.password, '密码')}
                              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>复制密码</p></TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Email */}
                      {entry.email && entry.username && (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-[13px] truncate text-muted-foreground flex-1">{entry.email}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(entry.email || '', '邮箱')}
                                className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>复制邮箱</p></TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Phone */}
                      {entry.phone && (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-[13px] truncate text-muted-foreground flex-1">{entry.phone}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(entry.phone || '', '手机号')}
                                className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-emerald-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>复制手机号</p></TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(entry.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {entry.url && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-500" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent><p>打开链接</p></TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => openEditDialog(entry)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>编辑</p></TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>删除</p></TooltipContent>
                            </Tooltip>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>删除密码</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除 &ldquo;{entry.title}&rdquo; 的密码记录吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {editMode ? '编辑密码' : '添加密码'}
              </DialogTitle>
              <DialogDescription>
                {editMode ? '修改密码信息' : '填写账号密码信息并保存'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="pw-title">项目名称 *</Label>
                  <Input
                    id="pw-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="例如：华为开发者平台"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="pw-category">分类</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="h-10">
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

              <div className="space-y-2">
                <Label htmlFor="pw-url">登录链接</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="pw-url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pw-username">账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-username"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="用户名或账号"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-password">密码 *</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="输入密码"
                      required
                      className="pl-9 pr-9 h-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('pw-password') as HTMLInputElement
                        input.type = input.type === 'password' ? 'text' : 'password'
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pw-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="关联邮箱"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-phone">手机号</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw-phone"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="关联手机号"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pw-notes">备注</Label>
                <Textarea
                  id="pw-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="添加备注信息..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }} className="h-10">
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitLoading || !formTitle.trim() || !formPassword.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                >
                  {submitLoading ? '保存中...' : editMode ? '保存修改' : '添加密码'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
