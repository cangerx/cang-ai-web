'use client'

import { useSiteStore } from '@/stores/site'
import { useEffect } from 'react'
import Link from 'next/link'
import { SubPageLayout } from '@/components/layout/SubPageLayout'
import { getModelDisplayName } from '@/lib/model-display'

export default function PricingPage() {
  const { config, fetchConfig } = useSiteStore()

  useEffect(() => {
    if (!config) fetchConfig()
  }, [config, fetchConfig])

  const cost = config?.cost_per_generation || 1
  const rules = config?.billing_rules || []

  return (
    <SubPageLayout narrow>
      <div className="sub-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="sub-header-text" style={{ width: '100%' }}>
          <h1 style={{ textAlign: 'center' }}>定价 & 计费</h1>
          <p style={{ textAlign: 'center' }}>按积分实时计费，用多少花多少，从不订阅锁定</p>
        </div>
      </div>

      <div className="pricing-hero">
        <div className="pricing-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="pricing-label">默认每次生成消耗</div>
        <div className="pricing-amount">
          {cost}<span className="pricing-amount-unit">积分</span>
        </div>
      </div>

      {rules.length > 0 && (
        <div className="pricing-rules-card">
          <div className="pricing-rules-head">计费规则明细</div>
          <table className="pricing-table">
            <thead>
              <tr>
                <th>模型</th>
                <th>质量</th>
                <th>积分</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={i}>
                  <td>{getModelDisplayName(r.model, config?.models || [], r.model === '*' ? '全部' : '模型')}</td>
                  <td style={{ color: '#71717a' }}>{r.quality === '*' ? '全部' : r.quality}</td>
                  <td>{r.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pricing-cta">
        <Link href="/">
          开始创作
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </SubPageLayout>
  )
}
