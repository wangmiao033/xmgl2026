'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: '管理员', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  manager: { label: '经理', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  member: { label: '成员', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
}

export function TeamView() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">团队管理</h1>
        <p className="text-muted-foreground">查看和管理团队成员</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const role = roleConfig[user.role] || roleConfig.member
            return (
              <Card key={user.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className={role.className}>
                      {role.label}
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{user._count.tasks}</p>
                        <p className="text-xs">分配任务</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
