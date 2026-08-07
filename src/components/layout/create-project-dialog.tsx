'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Gamepad2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateProjectDialogProps {
  onCreated?: () => void
}

export function CreateProjectDialog({ onCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [gameType, setGameType] = useState('')
  const [partnerCompany, setPartnerCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [cooperationMode, setCooperationMode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const [basePackageName, setBasePackageName] = useState('')
  const [isbn, setIsbn] = useState('')
  const [copyrightNo, setCopyrightNo] = useState('')
  const [appRecordNo, setAppRecordNo] = useState('')
  const [antiAddictionNo, setAntiAddictionNo] = useState('')
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setName('')
    setGameType('')
    setPartnerCompany('')
    setContactName('')
    setContactPhone('')
    setCooperationMode('')
    setStartDate('')
    setLaunchDate('')
    setBasePackageName('')
    setIsbn('')
    setCopyrightNo('')
    setAppRecordNo('')
    setAntiAddictionNo('')
    setDocName('')
    setDocUrl('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: 'game',
          status: 'active',
          gameType: gameType.trim() || undefined,
          partnerCompany: partnerCompany.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          cooperationMode: cooperationMode.trim() || undefined,
          startDate: startDate || undefined,
          launchDate: launchDate || undefined,
          basePackageName: basePackageName.trim() || undefined,
          isbn: isbn.trim() || undefined,
          copyrightNo: copyrightNo.trim() || undefined,
          appRecordNo: appRecordNo.trim() || undefined,
          antiAddictionNo: antiAddictionNo.trim() || undefined,
          docName: docName.trim() || undefined,
          docUrl: docUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || '项目创建失败')
        return
      }

      toast.success('项目创建成功')
      setOpen(false)
      resetForm()
      onCreated?.()
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('项目创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-emerald-600" />
            新建游戏项目
          </DialogTitle>
          <DialogDescription>
            先录入项目固定资料。渠道、包名和审核进度进入项目后再维护。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project-name">项目 / 游戏名称 *</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：云上征途"
                required
              />
            </div>
            <Field label="游戏类型" value={gameType} onChange={setGameType} placeholder="例如：三国卡牌 / 仙侠 / SLG" />
            <Field label="合作模式" value={cooperationMode} onChange={setCooperationMode} placeholder="例如：0.05折实付结算 / 常规联运" />
            <Field label="研发 / 合作方" value={partnerCompany} onChange={setPartnerCompany} placeholder="公司名称" />
            <Field label="联系人" value={contactName} onChange={setContactName} placeholder="联系人姓名" />
            <Field label="联系方式" value={contactPhone} onChange={setContactPhone} placeholder="手机 / 微信" />
            <Field label="基础包名" value={basePackageName} onChange={setBasePackageName} placeholder="com.xxx.game" />
            <DateField label="接入日期" value={startDate} onChange={setStartDate} />
            <DateField label="计划首发" value={launchDate} onChange={setLaunchDate} />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium">资质信息（可后补）</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="版号 / ISBN" value={isbn} onChange={setIsbn} placeholder="ISBN ..." />
              <Field label="软著登记号" value={copyrightNo} onChange={setCopyrightNo} placeholder="2026SR..." />
              <Field label="APP 备案号" value={appRecordNo} onChange={setAppRecordNo} placeholder="备案号" />
              <Field label="防沉迷备案码" value={antiAddictionNo} onChange={setAntiAddictionNo} placeholder="备案码" />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium">原始资料链接（可选）</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="资料名称" value={docName} onChange={setDocName} placeholder="例如：原项目进度表" />
              <Field label="资料链接" value={docUrl} onChange={setDocUrl} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-notes">项目备注</Label>
            <Textarea
              id="project-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="其他需要长期保留的项目说明"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading ? '创建中...' : '创建项目'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
