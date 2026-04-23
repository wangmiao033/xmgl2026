'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueDate: string
  project: {
    name: string
  }
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-sky-500',
  low: 'bg-slate-400',
}

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        const allTasks: Task[] = []
        data.forEach((project: any) => {
          project.tasks?.forEach((task: any) => {
            if (task.dueDate) {
              allTasks.push({
                ...task,
                project: { name: project.name },
              })
            }
          })
        })
        setTasks(allTasks)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = () => setCurrentDate(new Date())

  const getTasksForDate = (day: number, isCurrentMonth: boolean) => {
    const date = new Date(year, month, day)
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      if (!isCurrentMonth) {
        // Check prev/next month
        const adjustedDate = new Date(year, month < 0 ? 11 : month > 11 ? 0 : month, day)
        if (month < 0) adjustedDate.setFullYear(year - 1)
        if (month > 11) adjustedDate.setFullYear(year + 1)
      }
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      )
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const calendarDays: { day: number; isCurrentMonth: boolean }[] = []

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false })
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true })
  }
  // Next month days
  const remaining = 42 - calendarDays.length
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false })
  }

  const monthName = new Date(year, month).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">任务日历</h1>
        <p className="text-muted-foreground">查看任务截止日期</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{monthName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={today}>
                今天
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[500px] rounded-lg" />
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Weekday headers */}
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {calendarDays.map((item, index) => {
                const dayTasks = item.isCurrentMonth ? getTasksForDate(item.day, true) : []
                return (
                  <div
                    key={index}
                    className={cn(
                      'bg-background min-h-[80px] p-1.5',
                      !item.isCurrentMonth && 'opacity-40'
                    )}
                  >
                    <div
                      className={cn(
                        'text-xs font-medium mb-1',
                        item.isCurrentMonth && isToday(item.day)
                          ? 'h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.day}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 text-[10px] leading-tight"
                        >
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityColors[task.priority])} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayTasks.length - 2} 更多
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
