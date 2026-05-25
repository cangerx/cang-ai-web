'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { SettingsModal } from '@/components/home/SettingsModal'
import { SubPageLayout } from '@/components/layout/SubPageLayout'

export default function ProfilePage() {
  const router = useRouter()
  const { user, fetchMe } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(true)

  useEffect(() => { fetchMe() }, [fetchMe])

  // When modal closes, return to home
  const handleClose = () => {
    setModalOpen(false)
    setTimeout(() => router.push('/'), 200)
  }

  return (
    <SubPageLayout hideBack>
      <div className="sub-empty">
        {user ? (
          <>
            <span className="sub-empty-icon">⚙</span>
            <span>正在打开设置…</span>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 999,
                background: '#111113', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              打开设置
            </button>
          </>
        ) : (
          <>
            <span className="sub-empty-icon">🔒</span>
            <span>请先登录</span>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 999,
                background: '#111113', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              立即登录
            </button>
          </>
        )}
      </div>
      <SettingsModal open={modalOpen} onClose={handleClose} />
    </SubPageLayout>
  )
}
