'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Wallet, FileSpreadsheet, Lock, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinanceViewProps {
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
    avatar: string | null
  } | null
}

const financeLinks = [
  {
    title: '财务工具',
    description: '在线对账系统，管理渠道结算、收入对账和财务数据',
    url: 'https://caiwu2026.hnchpower.cn/',
    icon: Wallet,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/15',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    tag: '对账系统',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    title: '历史流水数据',
    description: '金山文档，包含各渠道历史对账明细与流水记录',
    url: 'https://www.kdocs.cn/l/chUcTHe2E4Xe',
    icon: FileSpreadsheet,
    color: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-100 dark:bg-sky-500/15',
    textColor: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200/60 dark:border-sky-800/40',
    hoverBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
    tag: '金山文档',
    tagColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
]

export function FinanceView({ currentUser }: FinanceViewProps) {
  const isFinanceUser = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')

  if (!isFinanceUser) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">财务管理</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            财务数据仅限管理员和经理查看
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-5">
            <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-[16px] font-semibold">无访问权限</p>
          <p className="text-[14px] text-muted-foreground mt-1.5 text-center max-w-[300px]">
            财务模块仅对管理员和经理角色开放，如需访问请联系管理员
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">财务管理</h1>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px] px-2 py-0.5 font-medium gap-1">
            <Lock className="h-3 w-3" />
            仅财务可见
          </Badge>
        </div>
        <p className="text-muted-foreground text-[15px]">
          财务数据入口，仅管理员和经理可访问
        </p>
      </div>

      {/* Link Cards */}
      <div className="grid gap-5 sm:grid-cols-2 max-w-3xl">
        {financeLinks.map((link, index) => {
          const Icon = link.icon
          return (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group block rounded-xl border shadow-card transition-all duration-300',
                'hover:shadow-card-hover hover:-translate-y-0.5',
                link.borderColor,
                link.hoverBorder,
                'animate-slide-up'
              )}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
              {/* Top gradient bar */}
              <div className={cn('h-[3px] bg-gradient-to-r rounded-t-xl', link.color)} />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
                    link.bgColor,
                    'group-hover:scale-105 transition-transform'
                  )}>
                    <Icon className={cn('h-6 w-6', link.textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-[16px] font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {link.title}
                      </h3>
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 font-medium', link.tagColor)}>
                        {link.tag}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                      {link.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="underline underline-offset-2 decoration-muted-foreground/30 group-hover:decoration-emerald-400/50">打开链接</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </a>
          )
        })}
      </div>

      {/* Info Notice */}
      <div className="max-w-3xl">
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <p className="font-medium mb-1">权限说明</p>
              <p className="text-amber-700 dark:text-amber-400">
                财务数据敏感，仅管理员和经理角色可查看此模块入口。普通成员无法访问。如需调整权限请联系系统管理员。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
