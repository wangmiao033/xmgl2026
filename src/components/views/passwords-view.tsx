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
  MoreHorizontal,
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

const categoryConfig: Record<string, { label: string; tagClass: string }> = {
  website: { label: '网站', tagClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  game: { label: '游戏', tagClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
  tool: { label: '工具', tagClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  server: { label: '服务器', tagClass: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  social: { label: '社交', tagClass: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400' },
  other: { label: '其他', tagClass: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' },
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
          setEntries(data)
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加密码
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索名称、网址、账号、备注..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 bg-background">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
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
              className={cn('h-9 px-3 text-[13px]', showAllPasswords && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30')}
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

        {/* Table */}
        <div className="rounded-xl border border-border/60 bg-card shadow-card overflow-hidden">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-[120px] shrink-0" />
                  <Skeleton className="h-5 w-[48px] shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-[180px] shrink-0" />
                  <Skeleton className="h-4 w-[140px] shrink-0" />
                  <Skeleton className="h-4 w-[100px] shrink-0" />
                  <Skeleton className="h-4 w-[90px] shrink-0" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-4">
                <KeyRound className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-[15px] font-medium">暂无密码记录</p>
              <p className="text-[13px] text-muted-foreground mt-1">点击上方按钮添加第一条密码记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                {/* Header */}
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[160px]">项目名称</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[72px]">分类</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[200px]">登录链接</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[160px]">账号</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[140px]">密码</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[120px]">更新日期</th>
                    <th className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap min-w-[120px]">备注</th>
                    <th className="text-center font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap w-[64px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const cat = categoryConfig[entry.category] || categoryConfig.other
                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          'border-b border-border/30 transition-colors group/row hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5',
                          index % 2 === 1 && 'bg-muted/20'
                        )}
                      >
                        {/* 项目名称 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => toggleFavorite(entry)}
                              className="shrink-0"
                            >
                              <Star className={cn('h-3.5 w-3.5 transition-colors',
                                entry.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-transparent hover:text-amber-300'
                              )} />
                            </button>
                            <span className="font-medium text-foreground truncate block">{entry.title}</span>
                          </div>
                        </td>

                        {/* 分类 */}
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', cat.tagClass)}>
                            {cat.label}
                          </span>
                        </td>

                        {/* 登录链接 */}
                        <td className="px-4 py-3">
                          {entry.url ? (
                            <a
                              href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline truncate min-w-0 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="truncate">{entry.url.replace(/^https?:\/\//, '')}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>

                        {/* 账号 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground">{entry.username || entry.email || '—'}</span>
                            {(entry.username || entry.email) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => copyToClipboard(entry.username || entry.email || '', '账号')}
                                    className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity hover:text-emerald-600"
                                  >
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>复制账号</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>

                        {/* 密码 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <KeyRound className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className={cn('truncate font-mono', showAllPasswords ? 'text-foreground' : 'text-muted-foreground')}>
                              {showAllPasswords ? entry.password : '••••••••'}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => copyToClipboard(entry.password, '密码')}
                                  className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity hover:text-emerald-600"
                                >
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>复制密码</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>

                        {/* 更新日期 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground whitespace-nowrap text-[12px]">
                              {formatDate(entry.updatedAt)}
                            </span>
                          </div>
                        </td>

                        {/* 备注 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate text-[12px]">{entry.notes || '—'}</span>
                          </div>
                        </td>

                        {/* 操作 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openEditDialog(entry)}
                                  className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>删除</TooltipContent>
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && entries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/30">
              <span className="text-[13px] text-muted-foreground">
                记录数: <span className="font-semibold text-foreground">{entries.length}</span>
              </span>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {entries.filter(e => e.isFavorite).length} 个收藏
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? '编辑密码' : '添加密码'}</DialogTitle>
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
