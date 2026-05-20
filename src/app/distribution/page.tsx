'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toaster'
import { SubPageLayout } from '@/components/layout/SubPageLayout'

export default function DistributionPage() {
  const { user, fetchMe } = useAuthStore()
  const [invites, setInvites] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (user?.is_distributor) {
      api.get('/distributor/invites').then(({ data }) => setInvites(data.data || [])).catch(() => {})
      api.get('/distributor/commissions').then(({ data }) => setCommissions(data.data || [])).catch(() => {})
    }
  }, [user])

  const handleApply = async () => {
    setApplying(true)
    try {
      const { data } = await api.post('/distributor/apply')
      toast(data.message || '申请成功', 'success')
      fetchMe()
    } catch (err: any) {
      toast(err.response?.data?.message || '申请失败', 'error')
    } finally {
      setApplying(false)
    }
  }

  const copyText = (text: string, btn?: HTMLButtonElement) => {
    navigator.clipboard.writeText(text)
    if (btn) { const orig = btn.textContent; btn.textContent = '已复制'; setTimeout(() => { btn.textContent = orig }, 1500) }
  }

  if (!user) {
    return (
      <SubPageLayout>
        <div className="sub-empty">
          <span className="sub-empty-icon">🔒</span>
          <span>请先登录后查看分销中心</span>
        </div>
      </SubPageLayout>
    )
  }

  if (!user.is_distributor) {
    return (
      <SubPageLayout>
        <div className="dist-apply">
          <div className="dist-apply-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2>开通分销</h2>
          <p>成为分销者后，邀请好友注册消费，即可获得 <strong style={{ color: '#ea580c' }}>10% 佣金</strong> 奖励，按积分实时结算</p>
          <button type="button" className="dist-apply-btn" onClick={handleApply} disabled={applying}>
            {applying ? '申请中...' : '申请成为分销者'}
          </button>
        </div>
      </SubPageLayout>
    )
  }

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${user.invite_code}` : ''
  const totalCommission = commissions.reduce((s: number, c: any) => s + (c.amount || 0), 0)

  return (
    <SubPageLayout>
      <div className="sub-header">
        <div className="sub-header-text">
          <h1>分销中心</h1>
          <p>分享你的邀请码，让朋友的每次消费都为你带来收益</p>
        </div>
      </div>

      <div className="dist-hero">
        <div className="dist-invite-card">
          <div className="dist-invite-label">你的邀请码</div>
          <div className="dist-invite-code">{user.invite_code || '—'}</div>
          <div className="dist-invite-link">
            <code>{inviteLink}</code>
            <button type="button" className="dist-invite-copy" onClick={(e) => copyText(inviteLink, e.currentTarget as HTMLButtonElement)}>复制</button>
          </div>
        </div>

        <div className="dist-stats">
          <div className="dist-stat">
            <div className="dist-stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div className="dist-stat-value">{invites.length}</div>
              <div className="dist-stat-label">已邀请用户</div>
            </div>
          </div>
          <div className="dist-stat">
            <div className="dist-stat-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>
              </svg>
            </div>
            <div>
              <div className="dist-stat-value">+{totalCommission}</div>
              <div className="dist-stat-label">累计返利积分</div>
            </div>
          </div>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="dist-list">
          <div className="dist-list-head">最近邀请</div>
          {invites.slice(0, 20).map((inv: any) => (
            <div key={inv.id} className="dist-list-row">
              <span style={{ color: '#333' }}>{inv.nickname || inv.name || inv.email}</span>
              <span style={{ color: '#a1a1aa', fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          ))}
        </div>
      )}

      {commissions.length > 0 && (
        <div className="dist-list">
          <div className="dist-list-head">返利记录</div>
          {commissions.slice(0, 20).map((c: any, i: number) => (
            <div key={i} className="dist-list-row">
              <span style={{ color: '#333' }}>{c.description || '返利'}</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>+{c.amount}</span>
            </div>
          ))}
        </div>
      )}
    </SubPageLayout>
  )
}
