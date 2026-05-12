'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CalendarCheck2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

interface LoginViewProps {
  onLogin: (user: { id: string; email: string; name: string; role: string; avatar: string | null }) => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberAccount, setRememberAccount] = useState(true)
  const [passwordFreeForOneDay, setPasswordFreeForOneDay] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('pm-login-email')
    const savedRememberAccount = localStorage.getItem('pm-remember-account')
    const savedRememberMe = localStorage.getItem('pm-remember-me')

    if (savedEmail) setEmail(savedEmail)
    if (savedRememberAccount) setRememberAccount(savedRememberAccount === 'true')
    if (savedRememberMe) setPasswordFreeForOneDay(savedRememberMe === 'true')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('请输入账号和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), rememberMe: passwordFreeForOneDay }),
      })

      const data = await res.json()

      if (res.ok && data.user) {
        if (rememberAccount) {
          localStorage.setItem('pm-login-email', email.trim())
        } else {
          localStorage.removeItem('pm-login-email')
        }
        localStorage.setItem('pm-remember-account', String(rememberAccount))
        localStorage.setItem('pm-remember-me', String(passwordFreeForOneDay))
        onLogin(data.user)
      } else {
        setError(data.error || '登录失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f3_52%,#f7f4ed_100%)] p-4 text-slate-950 dark:bg-[linear-gradient(135deg,#0f172a_0%,#10221f_55%,#171717_100%)] dark:text-slate-50 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-glow-emerald">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="mt-8 max-w-sm">
                <p className="text-sm font-medium text-emerald-300">XMGL 2026</p>
                <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-normal">
                  项目管理系统
                </h1>
                <p className="mt-4 text-[15px] leading-7 text-slate-300">
                  团队任务、项目进度、账号资料统一管理。登录后保持 1 天有效，下次打开可直接进入工作台。
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-[13px] text-slate-300">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <CalendarCheck2 className="h-4 w-4 text-emerald-300" />
                <span>1 天内无需重复输入密码</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-emerald-300" />
                <span>会话信息由安全 Cookie 保存</span>
              </div>
            </div>
          </section>

          <section className="px-5 py-7 sm:px-9 sm:py-9 lg:px-10 lg:py-12">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-glow-emerald">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase text-emerald-700 dark:text-emerald-300">XMGL 2026</p>
                <h1 className="text-xl font-semibold">项目管理系统</h1>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">账号登录</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
                欢迎回来
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-slate-500 dark:text-slate-400">
                登录后本设备 1 天内可直接进入系统，刷新页面不会退出。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700 animate-scale-in dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  账号
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱账号"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] shadow-none transition-all focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  密码
                </Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-11 text-[14px] shadow-none transition-all focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/70">
                <label htmlFor="seven-days-password-free" className="flex cursor-pointer items-start gap-3 rounded-xl bg-white px-3 py-3 shadow-sm dark:bg-slate-950">
                  <Checkbox
                    id="seven-days-password-free"
                    checked={passwordFreeForOneDay}
                    onCheckedChange={(checked) => setPasswordFreeForOneDay(checked === true)}
                    className="mt-0.5 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-slate-900 dark:text-slate-100">1 天免输入密码</span>
                    <span className="mt-1 block text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                      适合个人常用设备；公共电脑请取消勾选。
                    </span>
                  </span>
                </label>

                <label htmlFor="remember-account" className="flex cursor-pointer items-center gap-3 px-3 py-1.5">
                  <Checkbox
                    id="remember-account"
                    checked={rememberAccount}
                    onCheckedChange={(checked) => setRememberAccount(checked === true)}
                    className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                  />
                  <span className="text-[13px] text-slate-600 dark:text-slate-300">记住账号</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="h-12 w-full rounded-xl bg-emerald-600 text-[14px] font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/25 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录系统'
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-[12px] leading-5 text-slate-400">
              授权人员方可访问，请妥善保管账号密码。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
