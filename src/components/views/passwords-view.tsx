'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Star,
  ExternalLink,
  Globe,
  User,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Shield,
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

const categoryConfig: Record<string, { label: string; icon: React.ElementType; className: string; bgClass: string }> = {
  website: { label: '网站', icon: Globe, className: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-500/10' },
  game: { label: '游戏', icon: KeyRound, className: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-50 dark:bg-violet-500/10' },
  tool: { label: '工具', icon: Shield, className: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10' },
  server: { label: '服务器', icon: Shield, className: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-500/10' },
  social: { label: '社交', icon: User, className: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-50 dark:bg-pink-500/10' },
  other: { label: '其他', icon: KeyRound, className: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-50 dark:bg-slate-500/10' },
}

export function PasswordsView() {
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
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

  // Password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

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
      if (editMode && editId) {
        const res = await fetch(`/api/passwords/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            url: formUrl.trim() || null,
            username: formUsername.trim() || null,
            password: formPassword.trim(),
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
            notes: formNotes.trim() || null,
            category: formCategory,
          }),
        })
        if (res.ok) {
          toast.success('密码已更新')
          setDialogOpen(false)
          resetForm()
          setRefreshKey((k) => k + 1)
        }
      } else {
        const res = await fetch('/api/passwords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            url: formUrl.trim() || null,
            username: formUsername.trim() || null,
            password: formPassword.trim(),
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
            notes: formNotes.trim() || null,
            category: formCategory,
          }),
        })
        if (res.ok) {
          toast.success('密码已添加')
          setDialogOpen(false)
          resetForm()
          setRefreshKey((k) => k + 1)
        }
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

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label}已复制`)
    }).catch(() => {
      toast.error('复制失败')
    })
  }

  const favoriteEntries = entries.filter((e) => e.isFavorite)
  const regularEntries = entries.filter((e) => !e.isFavorite)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">密码管理</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            安全存储和管理团队账号密码信息，共 {entries.length} 条记录
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          添加密码
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索名称、网址、账号、备注..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-background"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background">
            <SelectValue placeholder="分类筛选" />
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
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-medium">暂无密码记录</p>
          <p className="text-sm text-muted-foreground mt-1.5">点击上方按钮添加第一条密码记录</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Favorites section */}
          {favoriteEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  收藏
                </h2>
                <span className="text-xs text-muted-foreground">({favoriteEntries.length})</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteEntries.map((entry) => (
                  <PasswordCard
                    key={entry.id}
                    entry={entry}
                    visible={visiblePasswords.has(entry.id)}
                    onToggleVisibility={() => togglePasswordVisibility(entry.id)}
                    onCopy={copyToClipboard}
                    onEdit={() => openEditDialog(entry)}
                    onDelete={() => handleDelete(entry.id)}
                    onToggleFavorite={() => toggleFavorite(entry)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular entries */}
          {regularEntries.length > 0 && (
            <div>
              {favoriteEntries.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    全部
                  </h2>
                  <span className="text-xs text-muted-foreground">({regularEntries.length})</span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularEntries.map((entry) => (
                  <PasswordCard
                    key={entry.id}
                    entry={entry}
                    visible={visiblePasswords.has(entry.id)}
                    onToggleVisibility={() => togglePasswordVisibility(entry.id)}
                    onCopy={copyToClipboard}
                    onEdit={() => openEditDialog(entry)}
                    onDelete={() => handleDelete(entry.id)}
                    onToggleFavorite={() => toggleFavorite(entry)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            <div className="space-y-2">
              <Label htmlFor="pw-title">名称 *</Label>
              <Input
                id="pw-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：华为开发者平台"
                required
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="pw-url">网址</Label>
                <Input
                  id="pw-url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10"
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
  )
}

// Password Card Sub-component
function PasswordCard({
  entry,
  visible,
  onToggleVisibility,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  entry: PasswordEntry
  visible: boolean
  onToggleVisibility: () => void
  onCopy: (text: string, label: string) => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const cat = categoryConfig[entry.category] || categoryConfig.other
  const CatIcon = cat.icon

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-card border-border/50 group overflow-hidden">
      {/* Top accent bar */}
      <div className={cn('h-[3px] w-full', entry.category === 'website' && 'bg-gradient-to-r from-blue-400 to-blue-500',
        entry.category === 'game' && 'bg-gradient-to-r from-violet-400 to-violet-500',
        entry.category === 'tool' && 'bg-gradient-to-r from-amber-400 to-amber-500',
        entry.category === 'server' && 'bg-gradient-to-r from-red-400 to-red-500',
        entry.category === 'social' && 'bg-gradient-to-r from-pink-400 to-pink-500',
        entry.category === 'other' && 'bg-gradient-to-r from-slate-300 to-slate-400',
      )} />

      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', cat.bgClass)}>
              <CatIcon className={cn('h-4 w-4', cat.className)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-[14px] font-semibold leading-snug line-clamp-1">{entry.title}</CardTitle>
              {entry.url && (
                <p className="text-[12px] text-muted-foreground truncate mt-0.5">{entry.url}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleFavorite}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Star className={cn('h-3.5 w-3.5 transition-colors',
                entry.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40 hover:text-amber-400'
              )} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-5 pb-5 space-y-2.5">
        {/* Username */}
        {entry.username && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[13px] font-medium truncate">{entry.username}</span>
            </div>
            <button
              onClick={() => onCopy(entry.username!, '账号')}
              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
              title="复制账号"
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Password */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[13px] font-mono font-medium truncate">
              {visible ? entry.password : '••••••••'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onToggleVisibility}
              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
              title={visible ? '隐藏密码' : '显示密码'}
            >
              {visible ? (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Eye className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => onCopy(entry.password, '密码')}
              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
              title="复制密码"
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Extra info */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          {entry.email && (
            <div className="flex items-center gap-1 min-w-0">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{entry.email}</span>
            </div>
          )}
          {entry.phone && (
            <div className="flex items-center gap-1 min-w-0">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{entry.phone}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {entry.notes && (
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 border-t border-border/40 pt-2.5 mt-1">
            {entry.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium', cat.bgClass, cat.className)}>
              {cat.label}
            </Badge>
            {entry.url && (
              <a
                href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                打开
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={onEdit}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              title="编辑"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="删除"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                </button>
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
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
