'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  className?: string
  iconColor?: string
  iconBg?: string
  valueColor?: string
}

function useCountUp(target: number, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(target)
  const currentValueRef = useRef(target)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startValue = currentValueRef.current
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuad
      const eased = progress * (2 - progress)
      const value = startValue + (target - startValue) * eased
      const rounded = Math.round(value)
      currentValueRef.current = rounded
      setDisplayValue(rounded)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return displayValue
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  iconBg = 'from-emerald-500/15 to-emerald-500/5',
  valueColor = 'text-slate-900 dark:text-slate-50',
}: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : null
  const animatedValue = useCountUp(numericValue ?? 0, 1000)

  return (
    <Card className={cn(
      'shadow-card shadow-glass hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300 bg-card border-border/40 overflow-hidden relative group',
      className
    )}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Gradient background overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Sparkle decoration - top right corner */}
      <div className="absolute top-3 right-3 animate-pulse-soft pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60 dark:bg-emerald-400/40" />
      </div>

      <CardContent className="p-5 lg:p-6 pl-6 lg:pl-7 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className={cn('text-[30px] font-bold tracking-tight leading-none tabular-nums', valueColor)}>
              {numericValue !== null ? animatedValue.toLocaleString() : value}
            </p>
            {description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{description}</p>
            )}
          </div>
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:ring-4 ring-emerald-500/10',
            iconBg
          )}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
