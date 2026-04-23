'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Building2, Bell, Moon, Globe, Database, Download, Trash2, Info } from 'lucide-react'
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

  const { companyName, companyDomain, taskNotify, deadlineNotify, statusNotify, emailDigest } = settings

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = () => {
    localStorage.setItem('pm-settings', JSON.stringify(settings))
    toast.success('设置已保存')
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-muted-foreground">管理系统偏好设置</p>
      </div>

      {/* Company settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain">公司域名</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Input
                id="companyDomain"
                value={companyDomain}
                onChange={(e) => updateSetting('companyDomain', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>任务分配通知</Label>
              <p className="text-xs text-muted-foreground">当有新任务分配给您时接收通知</p>
            </div>
            <Switch checked={taskNotify} onCheckedChange={(v) => updateSetting('taskNotify', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>任务截止提醒</Label>
              <p className="text-xs text-muted-foreground">任务截止日期前发送提醒</p>
            </div>
            <Switch checked={deadlineNotify} onCheckedChange={(v) => updateSetting('deadlineNotify', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>项目状态更新</Label>
              <p className="text-xs text-muted-foreground">项目状态变更时通知相关人员</p>
            </div>
            <Switch checked={statusNotify} onCheckedChange={(v) => updateSetting('statusNotify', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>邮件摘要</Label>
              <p className="text-xs text-muted-foreground">每日发送任务摘要到邮箱</p>
            </div>
            <Switch checked={emailDigest} onCheckedChange={(v) => updateSetting('emailDigest', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Theme settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            外观设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>深色模式</Label>
              <p className="text-xs text-muted-foreground">切换深色/浅色主题</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
      >
        保存设置
      </Button>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>导出数据</Label>
              <p className="text-xs text-muted-foreground">将所有项目数据导出为 JSON 文件</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-red-600">重置所有数据</Label>
              <p className="text-xs text-muted-foreground">删除所有项目、任务和设置数据</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            关于系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>系统名称</span>
              <span className="font-medium text-foreground">项目管理平台</span>
            </div>
            <div className="flex justify-between">
              <span>版本</span>
              <span className="font-medium text-foreground">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>技术栈</span>
              <span className="font-medium text-foreground">Next.js + Prisma + Tailwind</span>
            </div>
            <div className="flex justify-between">
              <span>开发团队</span>
              <span className="font-medium text-foreground">Z.ai</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
