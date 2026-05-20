'use client'

import { useEffect, useState, useRef } from 'react'
import { useSiteStore } from '@/stores/site'

export function AnnounceBar() {
  const { config } = useSiteStore()
  const [visible, setVisible] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const announcements = config?.announcements || []
  const singleAnnounce = config?.announcement

  const items = announcements.length > 0 ? announcements : (singleAnnounce ? [singleAnnounce] : [])

  useEffect(() => {
    if (items.length > 0) setVisible(true)
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % items.length)
      }, 6000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [items.length])

  if (!visible || items.length === 0) return null

  return (
    <div className="announce-bar">
      <span className="announce-tag">NEW</span>
      <span className="announce-content">
        <span
          className="announce-text"
          key={currentIdx}
          dangerouslySetInnerHTML={{ __html: items[currentIdx] }}
        />
      </span>
      <button
        className="announce-close"
        onClick={() => {
          setVisible(false)
          if (timerRef.current) clearInterval(timerRef.current)
        }}
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  )
}
