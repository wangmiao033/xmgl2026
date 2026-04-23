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
  return (
    <Card className={cn('shadow-card hover:shadow-card-hover transition-all duration-300 bg-card border-border/50', className)}>
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className={cn('text-[28px] font-bold tracking-tight leading-none', valueColor)}>{value}</p>
            {description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{description}</p>
            )}
          </div>
          <div className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
            iconBg
          )}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
