'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import { Building2, Bell, Moon, Globe } from 'lucide-react'

export function SettingsView() {
  const { theme, setTheme } = useTheme()

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
            <Input id="companyName" defaultValue="示例科技有限公司" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain">公司域名</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Input id="companyDomain" defaultValue="example.com" />
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
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>任务截止提醒</Label>
              <p className="text-xs text-muted-foreground">任务截止日期前发送提醒</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>项目状态更新</Label>
              <p className="text-xs text-muted-foreground">项目状态变更时通知相关人员</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>邮件摘要</Label>
              <p className="text-xs text-muted-foreground">每日发送任务摘要到邮箱</p>
            </div>
            <Switch />
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
    </div>
  )
}
