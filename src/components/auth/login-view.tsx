'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginViewProps {
  onLogin: (user: { id: string; email: string; name: string; role: string; avatar: string | null }) => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.user) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-500/15 dark:bg-teal-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 left-1/5 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-500/8 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/8 dark:bg-violet-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="w-full max-w-[400px] animate-blur-in relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-glow-emerald mb-4 animate-float-slow">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            项目管理系统
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1.5">
            企业内部管理系统
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            登录验证
          </p>
        </div>

        {/* Login Card - Glassmorphism */}
        <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-elevated shadow-glass p-8 relative overflow-hidden">
          {/* Subtle inner glow line at top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-[13px] text-red-600 dark:text-red-400 animate-scale-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-[13px] font-medium">
                账号
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱账号"
                className="h-12 rounded-xl bg-background/80 border-border/50 text-[14px] px-4 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-[13px] font-medium">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="h-12 rounded-xl bg-background/80 border-border/50 text-[14px] px-4 pr-10 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[14px] font-medium shadow-lg shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[12px] text-muted-foreground/60">
            授权人员方可访问 · 请妥善保管账号密码
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Powered by Z.ai
          </p>
        </div>
      </div>
    </div>
  )
}
