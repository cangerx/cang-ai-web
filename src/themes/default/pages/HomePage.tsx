'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSiteStore } from '@/stores/site'
import { useGeneratorStore } from '@/stores/generator'
import { useAuthStore } from '@/stores/auth'
import { AnnounceBar } from '@/components/home/AnnounceBar'
import { HeroLogin } from '@/components/home/HeroLogin'
import { ModeCards } from '@/components/home/ModeCards'
import { Composer } from '@/components/home/Composer'
import { GenerationStage } from '@/components/home/GenerationStage'
import { GalleryGrid } from '@/components/home/GalleryGrid'
import { Footer } from '@/components/home/Footer'
import { TaskBall } from '@/components/home/TaskBall'
import { MyWorksModal } from '@/components/home/MyWorksModal'

export default function HomePage() {
  const { config, fetchConfig } = useSiteStore()
  const { generating, mode, setMode, setFiles, files, activeTaskId, setActiveTaskId } = useGeneratorStore()
  const { setAuth, fetchMe } = useAuthStore()
  const [worksOpen, setWorksOpen] = useState(false)
  const [dropVisible, setDropVisible] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // OAuth token handler: #token=xxx
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/^#token=(.+)$/)
    if (match) {
      const token = match[1]
      window.history.replaceState({}, '', '/')
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
        .then(r => r.json())
        .then(data => {
          if (data.user) setAuth(token, data.user)
        })
        .catch(() => {})
    }
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('auth_error')
    if (authError) {
      window.history.replaceState({}, '', '/')
    }
  }, [setAuth])

  // Task persistence: save/restore active task ID
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('active_task_id', activeTaskId)
    } else {
      localStorage.removeItem('active_task_id')
    }
  }, [activeTaskId])

  useEffect(() => {
    const saved = localStorage.getItem('active_task_id')
    if (saved && !activeTaskId) {
      setActiveTaskId(saved)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDropVisible(true)
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current <= 0) { dragCounter.current = 0; setDropVisible(false) }
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDropVisible(false)
    const droppedFiles = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
    if (!droppedFiles.length) return
    if (mode !== 'image' && mode !== 'reverse') setMode('image')
    const merged = [...files, ...droppedFiles].slice(0, 4)
    setFiles(merged)
  }, [mode, files, setMode, setFiles])

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop])

  return (
    <main className={`page${generating || activeTaskId ? ' generating' : ''}`}>
      <AnnounceBar />
      <section className="hero">
        <HeroLogin />
        <h1>{config?.hero_title || config?.site_name || 'Visionary AI'}</h1>
      </section>

      <section id="workspace" className="workspace">
        <ModeCards />
        <GenerationStage />
        <Composer />

        <div className="bottom-actions cols-3">
          <button className="bottom-action-btn" type="button" onClick={() => window.open('/explore', '_blank')}>
            <span className="bottom-action-icon">✦</span>
            <span>灵感广场</span>
          </button>
          <button className="bottom-action-btn" type="button" onClick={() => window.open('/templates', '_blank')}>
            <span className="bottom-action-icon">✧</span>
            <span>提示词模板</span>
          </button>
          <button className="bottom-action-btn" type="button" onClick={() => setWorksOpen(true)}>
            <span className="bottom-action-icon">♦</span>
            <span>我的作品</span>
          </button>
        </div>

        <GalleryGrid />

        <Footer />
      </section>

      <TaskBall />
      <MyWorksModal open={worksOpen} onClose={() => setWorksOpen(false)} />
      {dropVisible && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">
            <div className="drop-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M2 6l3-3h4l2 3"/></svg></div>
            <div className="drop-title">释放以上传图片</div>
            <div className="drop-sub">支持拖拽最多 4 张图片</div>
          </div>
        </div>
      )}
    </main>
  )
}
