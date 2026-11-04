'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness, Plus, Search, Download, ArrowUpRight, Pencil, Trash2,
  Loader2, ShieldCheck, X, Clock3, Wallet, Flag, MessageSquareText, FileCheck2,
  RefreshCw, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type Opportunity, type ValidationKey, type VerificationStatus,
  createEmptyOpportunity, stages, paymentStates, contractStates, preworkStates,
  acceptanceStates, priorityStates, verificationLabels,
} from '@/types/overseas-opportunity'

type Board = 'all' | 'reply' | 'payment' | 'acceptance' | 'priority'
type FilterState = { country: string; type: string; stage: string; paid: string; prework: string }
type TextKey = Exclude<keyof Opportunity, 'id' | 'validation' | 'createdAt' | 'updatedAt'>
const emptyFilters: FilterState = { country: '', type: '', stage: '', paid: '', prework: '' }

const cards: Array<{ id: Board; label: string; icon: typeof BriefcaseBusiness }> = [
  { id: 'all', label: '项目总览', icon: BriefcaseBusiness },
  { id: 'reply', label: '待回复', icon: MessageSquareText },
  { id: 'payment', label: '待收款', icon: Wallet },
  { id: 'acceptance', label: '待验收', icon: FileCheck2 },
  { id: 'priority', label: '高优先级 P0', icon: Flag },
]

const formFields: Array<{ key: TextKey; label: string; kind?: 'textarea' | 'date' | 'url'; options?: string[] }> = [
  { key: 'company', label: '公司名称 *' },
  { key: 'country', label: '国家 / 地区' },
  { key: 'region', label: '所属区域' },
  { key: 'contact', label: '联系人' },
  { key: 'project', label: '项目名称 *' },
  { key: 'type', label: '合作类型（可多选，使用 / 分隔）' },
  { key: 'stage', label: '合作阶段', options: stages },
  { key: 'sourceUrl', label: '来源链接', kind: 'url' },
  { key: 'sourceDate', label: '发布日期', kind: 'date' },
  { key: 'confirmed', label: '已确认的信息', kind: 'textarea' },
  { key: 'unverified', label: '待核实的信息', kind: 'textarea' },
  { key: 'quote', label: '报价方式 / 金额' },
  { key: 'payment', label: '付款状态', options: paymentStates },
  { key: 'contract', label: '合同状态', options: contractStates },
  { key: 'acceptance', label: '验收状态', options: acceptanceStates },
  { key: 'replyOwner', label: '下一步回复方', options: ['我方', '对方', '双方', '暂无'] },
  { key: 'nextAction', label: '下一步行动', kind: 'textarea' },
  { key: 'due', label: '截止日期', kind: 'date' },
  { key: 'priority', label: '优先级', options: priorityStates },
  { key: 'prework', label: '是否需要继续投入前期工作', options: preworkStates },
  { key: 'employment', label: '合作用工形式' },
  { key: 'evidence', label: '验证来源 / 证据', kind: 'textarea' },
  { key: 'notes', label: '内部备注', kind: 'textarea' },
]

function matchesBoard(row: Opportunity, board: Board) {
  if (board === 'reply') return row.stage === '待回复' || row.stage === '会后待跟进' || row.replyOwner === '我方'
  if (board === 'payment') return row.payment === '待收款' || row.payment === '部分已收' || row.payment === '未收款'
  if (board === 'acceptance') return row.acceptance === '待验收' || row.acceptance === '验收中' || row.stage === '待验收'
  if (board === 'priority') return row.priority === 'P0'
  return true
}

function statusTone(value: string) {
  if (value.includes('已收') || value === '已签署' || value === '已验证' || value === '执行中') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (value === 'P0' || value === '待收款' || value === '未收款') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (value === '待核实' || value === '待评估' || value === '部分已收') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function exportDownload(filename: string, body: string, mime: string) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }))
  const element = document.createElement('a')
  element.href = url
  element.download = filename
  document.body.appendChild(element)
  element.click()
  element.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 3000)
}

function csvCell(input: unknown): string {
  let text = typeof input === 'string' ? input : String(input ?? '')
  // Mitigate spreadsheet formula injection in exported CRM data.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}

function FormInput({ row, onChange, field }: {
  row: Opportunity
  onChange: (key: TextKey, value: string) => void
  field: (typeof formFields)[number]
}) {
  const value = row[field.key] || ''
  const base = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  return (
    <label className={field.kind === 'textarea' ? 'block md:col-span-2' : 'block'}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
      {field.options ? (
        <select className={base} value={value} onChange={e => onChange(field.key, e.target.value)}>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          {value && !field.options.includes(value) && <option value={value}>{value}</option>}
        </select>
      ) : field.kind === 'textarea' ? (
        <textarea rows={3} className={base + ' resize-y'} value={value} onChange={e => onChange(field.key, e.target.value)} />
      ) : (
        <input type={field.kind || 'text'} className={base} value={value}
          onChange={e => onChange(field.key, e.target.value)} placeholder={field.key === 'sourceUrl' ? 'https://…' : ''} />
      )}
    </label>
  )
}

function Editor({ initial, saving, onClose, onSave, onDelete }: {
  initial: Opportunity
  saving: boolean
  onClose: () => void
  onSave: (row: Opportunity) => void
  onDelete: (id: string) => void
}) {
  const [row, setRow] = useState<Opportunity>(() => structuredClone(initial))
  const onChange = (key: TextKey, value: string) => setRow(old => ({ ...old, [key]: value }))
  const onValidation = (key: ValidationKey, property: 'status' | 'evidence', value: string) => {
    setRow(old => ({
      ...old,
      validation: {
        ...old.validation,
        [key]: { ...old.validation[key], [property]: value },
      },
    }))
  }
  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
  const verificationKeys: ValidationKey[] = ['investment', 'distribution', 'cases', 'payment']
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="overseas-editor-title">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="overseas-editor-title" className="text-lg font-semibold">{initial.id ? '编辑合作机会' : '新增合作机会'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">内部记录，不会发送邮件或联系合作方</p>
          </div>
          <button aria-label="关闭" disabled={saving} onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={event => { event.preventDefault(); onSave(row) }} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              {formFields.map(field => <FormInput key={field.key} field={field} row={row} onChange={onChange} />)}
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-600" /><h3 className="text-sm font-semibold">证据核验</h3></div>
              <p className="text-xs text-slate-500">必须有可靠证据，才手动标记“已验证”；咨询意向并不等于确定合作。</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {verificationKeys.map(key => (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3" key={key}>
                    <div className="text-xs font-semibold text-slate-700">{verificationLabels[key]}</div>
                    <select className={inputClass} value={row.validation[key]?.status || '待核实'}
                      onChange={e => onValidation(key, 'status', e.target.value as VerificationStatus)}>
                      {['待核实', '已验证', '不适用'].map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    <textarea className={inputClass} rows={2} placeholder="文件、邮件或支付凭证依据"
                      value={row.validation[key]?.evidence || ''}
                      onChange={e => onValidation(key, 'evidence', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4">
            <div>{initial.id && <button type="button" disabled={saving} onClick={() => onDelete(initial.id)} className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700"><Trash2 className="h-4 w-4" /> 删除记录</button>}</div>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">取消</button>
              <button type="submit" disabled={saving || !row.company.trim() || !row.project.trim()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} 保存记录
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export function OverseasOpportunitiesView() {
  const [records, setRecords] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [board, setBoard] = useState<Board>('all')
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<Opportunity | null>(null)
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/overseas-opportunities', { cache: 'no-store' })
      const body: unknown = await res.json()
      if (!res.ok || !Array.isArray(body)) {
        throw new Error((body && typeof body === 'object' && 'error' in body ? String(body.error) : '') || '加载失败')
      }
      setRecords(body as Opportunity[])
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取合作项目失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const counts = useMemo(() => Object.fromEntries(cards.map(item => [item.id, records.filter(row => matchesBoard(row, item.id)).length])) as Record<Board, number>, [records])

  const countries = useMemo(() => Array.from(new Set(records.map(row => row.country).filter(Boolean))).sort(), [records])
  const types = useMemo(() => Array.from(new Set(records.map(row => row.type).filter(Boolean))).sort(), [records])
  const stageList = useMemo(() => Array.from(new Set(records.map(row => row.stage).filter(Boolean))).sort(), [records])

  const visible = useMemo(() => records.filter(row => {
    if (!matchesBoard(row, board)) return false
    if (filters.country && row.country !== filters.country) return false
    if (filters.type && row.type !== filters.type) return false
    if (filters.stage && row.stage !== filters.stage) return false
    if (filters.paid === 'yes' && !['部分已收', '已收全款'].includes(row.payment)) return false
    if (filters.paid === 'no' && ['部分已收', '已收全款'].includes(row.payment)) return false
    if (filters.prework && row.prework !== filters.prework) return false
    const text = (row.company + ' ' + row.project + ' ' + row.contact + ' ' + row.type + ' ' + row.nextAction + ' ' + row.notes).toLowerCase()
    return !search.trim() || text.includes(search.trim().toLowerCase())
  }).sort((a, b) => {
    const score = (row: Opportunity) => priorityStates.indexOf(row.priority) === -1 ? 9 : priorityStates.indexOf(row.priority)
    return score(a) - score(b) || (a.due || '9999').localeCompare(b.due || '9999')
  }), [records, board, filters, search])

  const save = async (record: Opportunity) => {
    setSaving(true)
    try {
      const res = await fetch('/api/overseas-opportunities', {
        method: record.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存失败')
      setEditor(null)
      toast.success('记录已保存')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('确定删除这条合作机会吗？此操作不能撤销。')) return
    setSaving(true)
    try {
      const res = await fetch('/api/overseas-opportunities?id=' + encodeURIComponent(id), { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '删除失败')
      setEditor(null)
      toast.success('已删除')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const exportJson = () => {
    exportDownload('overseas-partnership-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(records, null, 2), 'application/json;charset=utf-8')
    toast.success('已导出 JSON 备份')
  }
  const exportCsv = () => {
    const fields: Array<keyof Opportunity> = ['company', 'country', 'contact', 'project', 'type', 'stage', 'quote', 'payment', 'contract', 'nextAction', 'due', 'priority', 'prework', 'acceptance', 'confirmed', 'unverified', 'notes']
    const labels = ['公司', '国家', '联系人', '项目', '合作类型', '阶段', '报价', '付款', '合同', '下一步', '截止时间', '优先级', '前期投入', '验收', '已确认', '待核实', '备注']
    const csv = [labels.map(csvCell).join(','), ...visible.map(row => fields.map(key => csvCell(row[key])).join(','))].join('\r\n')
    exportDownload('overseas-partnership-' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8')
    toast.success('已导出筛选结果')
  }
  const filterClass = 'h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-blue-400'
  const changeFilter = (key: keyof FilterState, value: string) => setFilters(previous => ({ ...previous, [key]: value }))

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <BriefcaseBusiness className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight">海外合作与顾问机会</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">欧洲与北美 · 发行 / ASO / UA / 中国市场评估 / 项目顾问</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void refresh()} aria-label="刷新" className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"><RefreshCw className="h-4 w-4" />刷新</button>
          <button onClick={exportCsv} disabled={!records.length} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" />CSV</button>
          <button onClick={exportJson} disabled={!records.length} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" />备份</button>
          <button onClick={() => setEditor(createEmptyOpportunity())} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"><Plus className="h-4 w-4" />新增机会</button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span><strong>执行边界：</strong>仅限非全职或项目制；优先低前期投入。所有邮件由本人发送；系统不会联系第三方、代为承诺合作。未核实的资金意愿、发行能力、案例与付款条款不得作为已确认事实。</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <button key={card.id} onClick={() => setBoard(card.id)}
              className={'rounded-xl border p-4 text-left transition hover:shadow-sm ' + (board === card.id ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300')}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <Icon className={'h-4 w-4 ' + (board === card.id ? 'text-blue-600' : 'text-slate-400')} />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{counts[card.id] || 0}</p>
            </button>
          )
        })}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              placeholder="搜索公司、项目、联系人、合作内容…" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <button onClick={() => setShowFilters(value => !value)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 lg:hidden">
            筛选条件 {showFilters ? '收起' : '展开'}
          </button>
        </div>
        <div className={(showFilters ? 'grid' : 'hidden') + ' mt-3 gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-5'}>
          <select className={filterClass} value={filters.country} onChange={e => changeFilter('country', e.target.value)}><option value="">全部国家 / 地区</option>{countries.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select className={filterClass} value={filters.type} onChange={e => changeFilter('type', e.target.value)}><option value="">全部合作类型</option>{types.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select className={filterClass} value={filters.stage} onChange={e => changeFilter('stage', e.target.value)}><option value="">全部阶段</option>{stageList.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select className={filterClass} value={filters.paid} onChange={e => changeFilter('paid', e.target.value)}><option value="">全部付款状态</option><option value="yes">已付款（含部分）</option><option value="no">未付款</option></select>
          <select className={filterClass} value={filters.prework} onChange={e => changeFilter('prework', e.target.value)}><option value="">全部前期投入</option>{preworkStates.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        {(filters.country || filters.type || filters.stage || filters.paid || filters.prework || search) && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>已匹配 {visible.length} 条记录</span>
            <button onClick={() => { setFilters(emptyFilters); setSearch('') }} className="text-blue-600 hover:underline">清空筛选</button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> 正在加载合作记录…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}<button onClick={() => void refresh()} className="ml-3 underline">重试</button></div>
      ) : !visible.length ? (
        <div className="rounded-xl border border-dashed bg-white p-16 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">此看板下暂无匹配机会</p>
          <button className="mt-3 text-sm text-blue-600 hover:underline" onClick={() => { setBoard('all'); setFilters(emptyFilters); setSearch('') }}>查看全部机会</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-between border-b bg-slate-50/70 px-4 py-3 text-xs text-slate-500"><span>共 {visible.length} 条 · 按优先级及截止日期排序</span><span>内部机密 · 仅管理员</span></div>
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-medium text-slate-500"><tr>
                {['公司 / 项目', '国家', '合作阶段', '优先级', '报价', '付款', '合同', '下一步行动', '截止', ''].map(t => <th key={t} className="whitespace-nowrap px-4 py-3 font-medium">{t}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map(row => (
                  <tr key={row.id} className="group align-top transition hover:bg-blue-50/30">
                    <td className="max-w-[230px] px-4 py-3.5">
                      <button className="text-left font-semibold text-slate-900 hover:text-blue-700" onClick={() => setEditor(row)}>{row.company}</button>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{row.project}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{row.contact || '联系人待补'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{row.country || '待核实'}</td>
                    <td className="px-4 py-3.5"><span className={'inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs ' + statusTone(row.stage)}>{row.stage || '待核实'}</span></td>
                    <td className="px-4 py-3.5"><span className={'inline-flex rounded-md border px-2 py-1 text-xs ' + statusTone(row.priority)}>{row.priority || 'P2'}</span></td>
                    <td className="max-w-[170px] px-4 py-3.5 text-xs leading-5 text-slate-600">{row.quote || '未报价'}</td>
                    <td className="px-4 py-3.5"><span className={'inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs ' + statusTone(row.payment)}>{row.payment || '待核实'}</span></td>
                    <td className="max-w-[145px] px-4 py-3.5 text-xs text-slate-600">{row.contract || '待核实'}</td>
                    <td className="max-w-[220px] px-4 py-3.5 text-xs leading-5 text-slate-600"><p className="line-clamp-3">{row.nextAction || '待填写'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {(Object.entries(row.validation || {}) as Array<[ValidationKey, { status: string; evidence: string }]>)
                          .filter(([, x]) => x.status === '已验证').map(([key]) => <span key={key} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">{verificationLabels[key]}已核</span>)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{row.due || '未设置'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button aria-label={'编辑 ' + row.company} onClick={() => setEditor(row)} title="编辑" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                        {row.sourceUrl?.startsWith('https://') && <a title="来源" aria-label={'查看 ' + row.company + ' 来源'} href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ArrowUpRight className="h-4 w-4" /></a>}
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="pb-3 text-xs text-slate-400">报价与付款状态根据人工输入记录，不会自动认定合作成立。新记录仅进入内部台账，不会触发对外联系。</p>
      {editor && <Editor key={editor.id || 'new'} initial={editor} saving={saving} onClose={() => setEditor(null)} onSave={row => void save(row)} onDelete={id => void remove(id)} />}
    </div>
  )
}
