'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'lucide-react'

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onUpdated?: () => void
}

export function EditProjectDialog({ open, onOpenChange, projectId, onUpdated }: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('game')
  const [docUrl, setDocUrl] = useState('')
  const [docName, setDocName] = useState('')
  const [progress, setProgress] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!open || !projectId) return
    let cancelled = false
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data) {
          setName(data.name || '')
          setDescription(data.description || '')
          setStatus(data.status || 'active')
          setPriority(data.priority || 'medium')
          setCategory(data.category || 'other')
          setDocUrl(data.docUrl || '')
          setDocName(data.docName || '')
          setProgress(data.progress || 0)
          setStartDate(data.startDate ? data.startDate.split('T')[0] : '')
          setEndDate(data.endDate ? data.endDate.split('T')[0] : '')
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          priority,
          category,
          docUrl: docUrl.trim() || null,
          docName: docName.trim() || null,
          progress: Number(progress),
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      })

      if (res.ok) {
        onOpenChange(false)
        onUpdated?.()
      }
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑项目</DialogTitle>
          <DialogDescription>修改项目信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">项目名称 *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">项目描述</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>项目状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>项目类型</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game">游戏项目</SelectItem>
                  <SelectItem value="tool">工具项目</SelectItem>
                  <SelectItem value="website">网站项目</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-progress">进度 ({progress}%)</Label>
              <Input
                id="edit-progress"
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="h-2"
              />
            </div>
          </div>

          {/* Document link section */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4 text-emerald-500" />
              在线文档链接
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-docName" className="text-xs text-muted-foreground">文档名称</Label>
              <Input
                id="edit-docName"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="例如：六界仙尊进度表"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-docUrl" className="text-xs text-muted-foreground">文档地址</Label>
              <Input
                id="edit-docUrl"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://www.kdocs.cn/l/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">开始日期</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">截止日期</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
