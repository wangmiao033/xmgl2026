'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, FolderKanban, Shield, Crown, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface User {
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
}

const roleConfig: Record<string, { label: string; className: string; icon: React.ElementType; color: string }> = {
  admin: { label: '管理员', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Crown, color: 'from-red-500 to-rose-500' },
  manager: { label: '经理', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Shield, color: 'from-emerald-500 to-teal-500' },
  member: { label: '成员', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: User, color: 'from-sky-500 to-blue-500' },
}

export function TeamView() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('member')

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
      }
    } catch (error) {
      console.error('Error adding member:', error)
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">团队管理</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">查看和管理团队成员，共 {users.length} 人</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          添加成员
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user, index) => {
            const role = roleConfig[user.role] || roleConfig.member
            const RoleIcon = role.icon
            return (
              <Card
                key={user.id}
                className="transition-all duration-300 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 border-border/40 overflow-hidden group animate-slide-up"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
              >
                {/* Top gradient bar */}
                <div className={cn('h-[2.5px] bg-gradient-to-r', role.color)} />
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-2 ring-border/50 ring-offset-2 ring-offset-card shadow-sm group-hover:ring-emerald-300 dark:group-hover:ring-emerald-700 transition-all">
                        <AvatarFallback className={cn('text-lg font-semibold', user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : user.role === 'manager' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400')}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r flex items-center justify-center shadow-sm', role.color)}>
                        <RoleIcon className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px]">{user.name}</h3>
                      <p className="text-[13px] text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className={cn('text-[11px] px-2.5 py-0.5 font-medium', role.className)}>
                      {role.label}
                    </Badge>
                    <div className="flex items-center gap-8 text-center pt-2 w-full">
                      <div className="flex-1">
                        <p className="text-xl font-bold tabular-nums text-foreground">{user._count.tasks}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">分配任务</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div className="flex-1">
                        <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{user.completedTasks}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">已完成</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div className="flex-1">
                        <p className="text-xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{user.projectCount}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">参与项目</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add member dialog */}
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
    </div>
  )
}
