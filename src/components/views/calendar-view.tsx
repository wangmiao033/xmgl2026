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

const priorityBgColors: Record<string, string> = {
  urgent: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  high: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
  medium: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
  low: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
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
  const goToday = () => setCurrentDate(new Date())

  const getTasksForDate = (day: number, isCurrentMonth: boolean) => {
    const date = new Date(year, month, day)
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      )
    })
  }

  const isToday = (day: number) => {
    const todayDate = new Date()
    return todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === day
  }

  const calendarDays: { day: number; isCurrentMonth: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true })
  }
  const remaining = 42 - calendarDays.length
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false })
  }

  const monthName = new Date(year, month).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">任务日历</h1>
        <p className="text-muted-foreground mt-1 text-[15px]">查看任务截止日期与排期</p>
      </div>

      <Card className="shadow-card border-border/40 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px] font-semibold">{monthName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday} className="h-8 px-3 rounded-lg text-[13px]">
                今天
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[500px] rounded-lg" />
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border/50 rounded-xl overflow-hidden shadow-inner">
              {/* Weekday headers */}
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    'bg-muted/80 py-2.5 text-center text-[12px] font-semibold uppercase tracking-wider',
                    (index === 0 || index === 6) ? 'text-red-400 dark:text-red-500/70' : 'text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {calendarDays.map((item, index) => {
                const dayTasks = item.isCurrentMonth ? getTasksForDate(item.day, true) : []
                const today = item.isCurrentMonth && isToday(item.day)
                const isWeekend = (index % 7 === 0 || index % 7 === 6) && item.isCurrentMonth
                return (
                  <div
                    key={index}
                    className={cn(
                      'bg-card min-h-[85px] p-1.5 transition-colors hover:bg-muted/30',
                      !item.isCurrentMonth && 'opacity-30',
                      isWeekend && 'bg-muted/20',
                      today && 'bg-emerald-50/50 dark:bg-emerald-500/5'
                    )}
                  >
                    <div
                      className={cn(
                        'text-[12px] font-medium mb-1.5 flex items-center justify-center',
                        today
                          ? 'h-6 w-6 rounded-full bg-emerald-600 text-white shadow-sm animate-pulse-glow'
                          : isWeekend
                            ? 'text-red-400 dark:text-red-500/60'
                            : 'text-muted-foreground'
                      )}
                    >
                      {item.day}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium truncate',
                            priorityBgColors[task.priority] || priorityBgColors.low
                          )}
                        >
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityColors[task.priority])} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1.5 font-medium">
                          +{dayTasks.length - 3} 更多
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
