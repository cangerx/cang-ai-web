'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import { SettingsModal } from '@/components/home/SettingsModal'

interface Props {
  children: React.ReactNode
  /** Use narrower container (max-width 720px) for centered content */
  narrow?: boolean
  /** Hide the back-to-home button */
  hideBack?: boolean
}

export function SubPageLayout({ children, narrow = false, hideBack = false }: Props) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { config, fetchConfig } = useSiteStore()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!config) fetchConfig()
  }, [config, fetchConfig])

  const siteName = config?.site_name || 'CANG-AI'
  const initial = (user?.nickname || user?.name || 'U').charAt(0).toUpperCase()

  return (
    <div className="sub-page">
      <header className="sub-nav">
        <div className="sub-nav-inner">
          <div className="sub-nav-left">
            {!hideBack && (
              <button type="button" className="sub-nav-back" onClick={() => router.push('/')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                返回
              </button>
            )}
            <Link href="/" className="sub-nav-brand">{siteName}</Link>
          </div>

          <div className="sub-nav-right">
            {user ? (
              <button type="button" className="sub-nav-user" onClick={() => setModalOpen(true)}>
                <div className="sub-nav-avatar">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" />
                  ) : initial}
                </div>
                <span className="sub-nav-credits">
                  <span className="sub-nav-credits-icon">●</span>
                  {user.credits}
                </span>
              </button>
            ) : (
              <button type="button" className="sub-nav-login" onClick={() => setModalOpen(true)}>
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`sub-container${narrow ? ' narrow' : ''}`}>
        {children}
      </div>

      <SettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
