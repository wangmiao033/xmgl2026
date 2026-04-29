'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Building2, Bell, Moon, Globe, Database, Download, Trash2, Info, Palette, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

  const { companyName, companyDomain, taskNotify, deadlineNotify, statusNotify, emailDigest } = settings

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

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
    if (newPassword.length < 4) {
      toast.error('新密码至少需要4个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setChangingPwd(true)
    try {
      // Get current user from session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      if (!sessionData.authenticated || !sessionData.user?.id) {
        toast.error('登录已过期，请重新登录')
        return
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionData.user.id,
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

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-1 text-[15px]">管理系统偏好设置</p>
      </div>

      {/* Company settings - Enhanced */}
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

      {/* Notification settings - Enhanced */}
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

      {/* Theme settings - Enhanced */}
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

      {/* Account security - Enhanced */}
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

          {/* Old password */}
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

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-[13px]">新密码</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少4位）"
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
            {newPassword && newPassword.length > 0 && newPassword.length < 4 && (
              <p className="text-[12px] text-amber-600 dark:text-amber-400">密码长度至少4个字符</p>
            )}
          </div>

          {/* Confirm password */}
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
            disabled={changingPwd || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 4}
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

      {/* Data management - Enhanced */}
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

      {/* About - Enhanced */}
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
    </div>
  )
}
