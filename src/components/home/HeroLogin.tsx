'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { SettingsModal } from './SettingsModal'

export function HeroLogin() {
  const { user, token, hydrate, fetchMe } = useAuthStore()
  const { settingsOpen, openSettings, closeSettings } = useUIStore()
  const [showCredits, setShowCredits] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    hydrate()
    const s = useAuthStore.getState()
    if (s.token) fetchMe()
  }, [hydrate, fetchMe])

  useEffect(() => {
    if (!user) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => {
      setShowCredits((v) => !v)
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [user])

  const displayText = user
    ? (showCredits ? `${user.credits ?? 0}积分` : (user.nickname || user.name || '用户'))
    : '登录'

  return (
    <>
      <button className="hero-login" type="button" onClick={openSettings}>
        {user ? (
          user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-login-avatar" src={user.avatar_url} alt="" />
          ) : (
            <span className="hero-login-initial">{(user.nickname || user.name || 'U').charAt(0).toUpperCase()}</span>
          )
        ) : (
          <span className="key-dot" />
        )}
        <span
          ref={labelRef}
          id="keyLabel"
          key={showCredits ? 'credits' : 'name'}
          className="hero-login-label"
        >
          {displayText}
        </span>
      </button>
      <SettingsModal open={settingsOpen} onClose={closeSettings} />
    </>
  )
}
