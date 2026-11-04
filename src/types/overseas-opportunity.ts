export type VerificationStatus = '已验证' | '待核实' | '不适用'
export type ValidationKey = 'investment' | 'distribution' | 'cases' | 'payment'

export interface ValidationItem {
  status: VerificationStatus
  evidence: string
}

export interface Opportunity {
  id: string
  company: string
  country: string
  region: string
  contact: string
  project: string
  type: string
  stage: string
  sourceUrl: string
  sourceDate: string
  confirmed: string
  unverified: string
  quote: string
  payment: string
  contract: string
  nextAction: string
  due: string
  notes: string
  priority: string
  replyOwner: string
  prework: string
  acceptance: string
  validation: Record<ValidationKey, ValidationItem>
  lastUpdated: string
  employment: string
  evidence: string
  createdAt?: string
  updatedAt?: string
}

export const verificationLabels: Record<ValidationKey, string> = {
  investment: '投资 / 预算意愿',
  distribution: '发行能力',
  cases: '合作案例',
  payment: '付款条件',
}

export const stages = ['线索池', '信息待核实', '资质核实', '待回复', '商务沟通', '报价沟通', '会后待跟进', '合同审查', '待收款', '执行中', '待验收', '已完成', '暂停观察']
export const paymentStates = ['尚未约定', '待收款', '部分已收', '已收全款', '未收款', '不适用']
export const contractStates = ['未签署', '待对方出具', '合同审查', '待签署', '已签署', 'NDA已签，项目合同待签', '不适用']
export const preworkStates = ['暂不需要', '待评估', '需要继续投入']
export const acceptanceStates = ['未开始', '待验收', '验收中', '已验收', '不适用']
export const priorityStates = ['P0', 'P1', 'P2', 'P3']

export function createEmptyOpportunity(): Opportunity {
  const validation = {
    investment: { status: '待核实' as const, evidence: '' },
    distribution: { status: '待核实' as const, evidence: '' },
    cases: { status: '待核实' as const, evidence: '' },
    payment: { status: '待核实' as const, evidence: '' },
  }
  return {
    id: '', company: '', country: '', region: '', contact: '', project: '',
    type: '', stage: '线索池', sourceUrl: '', sourceDate: '',
    confirmed: '', unverified: '', quote: '', payment: '尚未约定',
    contract: '未签署', nextAction: '', due: '', notes: '', priority: 'P2',
    replyOwner: '我方', prework: '待评估', acceptance: '未开始',
    validation, lastUpdated: '', employment: '非全职 / 项目制', evidence: '',
  }
}
