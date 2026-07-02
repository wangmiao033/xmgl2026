'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Building2, Bell, Moon, Globe, Database, Download, Trash2, Info, Palette, KeyRound, Eye, EyeOff, Loader2, Users, UserPlus, Shield, Crown, User, Activity, CheckCircle2, FolderKanban, Pencil } from 'lucide-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOnlineUsers } from '@/hooks/use-online-users'

/* ========== Settings Types & Defaults ========== */

interface Settings {
  companyName: string
  companyDomain: string
  taskNotify: boolean
  deadlineNotify: boolean
  statusNotify: boolean
  emailDigest: boolean
}

const defaultSettings: Settings = {
  companyName: '示例科技有限公司',
  companyDomain: 'example.com',
  taskNotify: true,
  deadlineNotify: true,
  statusNotify: true,
  emailDigest: false,
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const saved = localStorage.getItem('pm-settings')
    if (saved) {
      const s = JSON.parse(saved)
      return {
        companyName: s.companyName || defaultSettings.companyName,
        companyDomain: s.companyDomain || defaultSettings.companyDomain,
        taskNotify: s.taskNotify !== undefined ? s.taskNotify : defaultSettings.taskNotify,
        deadlineNotify: s.deadlineNotify !== undefined ? s.deadlineNotify : defaultSettings.deadlineNotify,
        statusNotify: s.statusNotify !== undefined ? s.statusNotify : defaultSettings.statusNotify,
        emailDigest: s.emailDigest !== undefined ? s.emailDigest : defaultSettings.emailDigest,
      }
    }
  } catch {
    // ignore
  }
  return defaultSettings
}

/* ========== Team Types & Helpers ========== */

interface TeamUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
  _count: {
    tasks: number
  }
  completedTasks: number
  projectCount: number
  isOnline: boolean
  lastActivity: number | null
}

const roleConfig: Record<string, { label: string; className: string; icon: React.ElementType; color: string }> = {
  admin: { label: '管理员', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Crown, color: 'from-red-500 to-rose-500' },
  manager: { label: '经理', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Shield, color: 'from-emerald-500 to-teal-500' },
  member: { label: '成员', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: User, color: 'from-sky-500 to-blue-500' },
}

function formatLastActivity(lastActivity: number | null): string {
  if (!lastActivity) return '离线'
  const diff = Date.now() - lastActivity
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚活跃'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

/* ========== Settings View ========== */

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [saving, setSaving] = useState(false)

  // Change password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  // Team management state
  const [users, setUsers] = useState<TeamUser[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('member')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<TeamUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState<TeamUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { onlineUsers, onlineCount } = useOnlineUsers()

  const { companyName, companyDomain, taskNotify, deadlineNotify, statusNotify, emailDigest } = settings

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Team management functions
  const fetchUsers = useCallback(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data)
        setTeamLoading(false)
      })
      .catch(() => setTeamLoading(false))
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return

    setAddLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
        }),
      })

      if (res.ok) {
        toast.success('成员已添加')
        setNewName('')
        setNewEmail('')
        setNewRole('member')
        setAddDialogOpen(false)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || '添加失败')
      }
    } catch (error) {
      toast.error('添加成员失败')
    } finally {
      setAddLoading(false)
    }
  }

  const handleOpenEdit = (user: TeamUser) => {
    setEditUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditDialogOpen(true)
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser || !editName.trim() || !editEmail.trim()) return

    setEditLoading(true)
    try {
      const res = await fetch(`/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editUser.id,
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
        }),
      })

      if (res.ok) {
        toast.success('成员信息已更新')
        setEditDialogOpen(false)
        setEditUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || '更新失败')
      }
    } catch {
      toast.error('更新成员信息失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenDelete = (user: TeamUser) => {
    setDeleteUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteMember = async () => {
    if (!deleteUser) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/users?id=${deleteUser.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('成员已删除')
        setDeleteDialogOpen(false)
        setDeleteUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || '删除失败')
      }
    } catch {
      toast.error('删除成员失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  // General settings functions
  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem('pm-settings', JSON.stringify(settings))
      toast.success('设置已保存')
      setSaving(false)
    }, 500)
  }

  const handleExportData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/users'),
      ])
      const projects = await projectsRes.json()
      const users = await usersRes.json()
      const data = { projects, users, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pm-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch {
      toast.error('数据导出失败')
    }
  }

  const handleResetData = async () => {
    try {
      const projectsRes = await fetch('/api/projects')
      const projects = await projectsRes.json()
      for (const project of projects) {
        await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      }
      localStorage.removeItem('pm-settings')
      setSettings(defaultSettings)
      toast.success('所有数据已重置')
    } catch {
      toast.error('重置数据失败')
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('请填写完整信息')
      return
    }
    if (newPassword.length < 8) {
      toast.error('新密码至少需要8个字符，需包含字母和数字')
      return
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('密码需包含至少一个字母和一个数字')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setChangingPwd(true)
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      const userId = sessionData.user?.id || sessionData.user?.userId
      if (!sessionData.authenticated || !userId) {
        toast.error('登录已过期，请重新登录')
        return
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('密码修改成功')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || '修改失败')
      }
    } catch {
      toast.error('修改密码失败')
    } finally {
      setChangingPwd(false)
    }
  }

  // Team stats
  const totalTasks = users.reduce((sum, u) => sum + u._count.tasks, 0)
  const completedTasks = users.reduce((sum, u) => sum + u.completedTasks, 0)
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const projectsCovered = users.filter((u) => u.projectCount > 0).length
  const projectCoverageRate = users.length > 0 ? Math.round((projectsCovered / users.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-1 text-[15px]">管理系统偏好设置与团队成员</p>
      </div>

      {/* Company settings */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 shadow-sm">
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            公司信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">公司名称</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => updateSetting('companyName', e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain">公司域名</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyDomain"
                value={companyDomain}
                onChange={(e) => updateSetting('companyDomain', e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification settings */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-500/15 dark:to-blue-500/15 shadow-sm">
              <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">任务分配通知</Label>
              <p className="text-[12px] text-muted-foreground">当有新任务分配给您时接收通知</p>
            </div>
            <div className={cn(taskNotify && 'shadow-[0_0_8px_rgba(16,185,129,0.2)] rounded-full transition-shadow duration-300')}>
              <Switch checked={taskNotify} onCheckedChange={(v) => updateSetting('taskNotify', v)} />
            </div>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">任务截止提醒</Label>
              <p className="text-[12px] text-muted-foreground">任务截止日期前发送提醒</p>
            </div>
            <div className={cn(deadlineNotify && 'shadow-[0_0_8px_rgba(16,185,129,0.2)] rounded-full transition-shadow duration-300')}>
              <Switch checked={deadlineNotify} onCheckedChange={(v) => updateSetting('deadlineNotify', v)} />
            </div>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">项目状态更新</Label>
              <p className="text-[12px] text-muted-foreground">项目状态变更时通知相关人员</p>
            </div>
            <div className={cn(statusNotify && 'shadow-[0_0_8px_rgba(16,185,129,0.2)] rounded-full transition-shadow duration-300')}>
              <Switch checked={statusNotify} onCheckedChange={(v) => updateSetting('statusNotify', v)} />
            </div>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">邮件摘要</Label>
              <p className="text-[12px] text-muted-foreground">每日发送任务摘要到邮箱</p>
            </div>
            <div className={cn(emailDigest && 'shadow-[0_0_8px_rgba(16,185,129,0.2)] rounded-full transition-shadow duration-300')}>
              <Switch checked={emailDigest} onCheckedChange={(v) => updateSetting('emailDigest', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme settings */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/15 dark:to-purple-500/15 shadow-sm">
              <Palette className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            外观设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">深色模式</Label>
              <p className="text-[12px] text-muted-foreground">切换深色/浅色主题</p>
            </div>
            <div className={cn(theme === 'dark' && 'shadow-[0_0_8px_rgba(16,185,129,0.2)] rounded-full transition-shadow duration-300')}>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-11 shadow-sm hover:shadow-glow-emerald transition-shadow duration-300"
      >
        {saving ? '保存中...' : '保存设置'}
      </Button>

      {/* Account security */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/15 dark:to-pink-500/15 shadow-sm">
              <KeyRound className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            账号安全
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[13px] text-muted-foreground">修改登录密码，建议定期更换以保障账号安全。</p>
          <div className="space-y-1.5">
            <Label htmlFor="old-password" className="text-[13px]">原密码</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOldPwd ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPwd(!showOldPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {showOldPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-[13px]">新密码</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少8位，含字母和数字）"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-[12px] text-amber-600 dark:text-amber-400">密码长度至少8个字符，需包含字母和数字</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-[13px]">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[12px] text-red-500">两次输入的密码不一致</p>
            )}
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPwd || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)}
            className="bg-rose-600 hover:bg-rose-700 text-white w-full h-10 shadow-sm"
          >
            {changingPwd ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />修改中...</>
            ) : (
              '修改密码'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/15 dark:to-blue-500/15 shadow-sm">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              团队管理
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 text-[13px] shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              添加成员
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-[13px] text-muted-foreground">
            管理团队成员，共 {users.length} 人，当前在线 {onlineCount} 人
          </p>

          {/* Team Stats */}
          {!teamLoading && users.length > 0 && (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2.5">
                <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">在线</p>
                  <p className="text-[15px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{onlineCount}<span className="text-[11px] font-normal text-muted-foreground">/{users.length}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-sky-500/5 border border-sky-500/10 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">任务完成率</p>
                  <p className="text-[15px] font-bold tabular-nums">{taskCompletionRate}<span className="text-[11px] font-normal text-muted-foreground">%</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10 px-3 py-2.5">
                <FolderKanban className="h-4 w-4 text-violet-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">项目覆盖率</p>
                  <p className="text-[15px] font-bold tabular-nums">{projectCoverageRate}<span className="text-[11px] font-normal text-muted-foreground">%</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2.5">
                <Users className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">总任务</p>
                  <p className="text-[15px] font-bold tabular-nums">{totalTasks}</p>
                </div>
              </div>
            </div>
          )}

          {/* Team Members List */}
          {teamLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const role = roleConfig[user.role] || roleConfig.member
                const RoleIcon = role.icon
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-all duration-200 group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 ring-2 ring-border/30 ring-offset-1 ring-offset-card">
                        <AvatarFallback className={cn(
                          'text-sm font-semibold',
                          user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          user.role === 'manager' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                        )}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                        user.isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-gray-300 dark:bg-gray-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-foreground truncate">{user.name}</span>
                        <div className={cn('h-5 w-5 rounded-full bg-gradient-to-r flex items-center justify-center', role.color)}>
                          <RoleIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        {user.isOnline && (
                          <span className="text-[11px] text-emerald-500">在线</span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5 font-medium shrink-0', role.className)}>
                      {role.label}
                    </Badge>
                    <div className="hidden sm:flex items-center gap-3 text-[12px] text-muted-foreground shrink-0 tabular-nums">
                      <span>{user._count.tasks}任务</span>
                      <span className="text-emerald-500">{user.completedTasks}完成</span>
                      <span className="text-sky-500">{user.projectCount}项目</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        onClick={() => handleOpenEdit(user)}
                        title="编辑"
                      >
                        <Pencil className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => handleOpenDelete(user)}
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data management */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/15 dark:to-orange-500/15 shadow-sm">
              <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px]">导出数据</Label>
              <p className="text-[12px] text-muted-foreground">将所有项目数据导出为 JSON 文件</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData} className="h-9 px-4 rounded-lg">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px] text-red-600 dark:text-red-400">重置所有数据</Label>
              <p className="text-[12px] text-muted-foreground">删除所有项目、任务和设置数据</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4 mr-2" />
                  重置
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认重置</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将删除所有项目、任务数据并重置设置。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetData}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    确认重置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="shadow-card bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
        <div className="h-[3px] bg-gradient-to-r from-slate-300 via-slate-400 to-slate-400/60" />
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-500/15 dark:to-slate-600/15 shadow-sm">
              <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            关于系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-[14px]">
            {[
              { label: '系统名称', value: '项目管理平台' },
              { label: '版本', value: 'v1.0.0' },
              { label: '技术栈', value: 'Next.js + Prisma + Tailwind' },
              { label: '开发团队', value: 'Z.ai' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              添加成员
            </DialogTitle>
            <DialogDescription>输入新成员信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">姓名 *</Label>
              <Input
                id="member-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入成员姓名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">邮箱 *</Label>
              <Input
                id="member-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="输入邮箱地址"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                type="submit"
                disabled={addLoading || !newName.trim() || !newEmail.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {addLoading ? '添加中...' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              编辑成员
            </DialogTitle>
            <DialogDescription>修改成员信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入成员姓名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱 *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="输入邮箱地址"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button
                type="submit"
                disabled={editLoading || !editName.trim() || !editEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editLoading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                <Trash2 className="h-4 w-4" />
              </div>
              删除成员
            </DialogTitle>
            <DialogDescription>
              确定要删除成员 <span className="font-medium text-foreground">{deleteUser?.name}</span> 吗？此操作不可撤销，该成员关联的任务将被取消分配。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleDeleteMember}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
