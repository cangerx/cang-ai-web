'use client'

import '../styles/main.css'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSiteStore } from '@/stores/site'
import { useGeneratorStore } from '@/stores/generator'
import { useAuthStore } from '@/stores/auth'
import { Composer } from '@/components/home/Composer'
import { GenerationStage } from '@/components/home/GenerationStage'
import { ModeCards } from '@/components/home/ModeCards'
import { HeroLogin } from '@/components/home/HeroLogin'
import { MyWorksModal } from '@/components/home/MyWorksModal'
import { TaskBall } from '@/components/home/TaskBall'

/**
 * chatgpt-like 模板的 Home 页：左侧栏 + 中央对话式生成区
 * 
 * 融合了基础底层逻辑：
 * 1. OAuth 回调解析 (#token=xxx)
 * 2. 任务状态本地存储 (localStorage)
 * 3. 全局拖拽参考图支持 (Drag & Drop)
 */
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

  // 1. OAuth 回调处理: #token=xxx
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

  // 2. 任务持久化：保存/恢复激活中的生成任务 ID
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 3. 全局拖拽参考图片逻辑
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
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDropVisible(false)
    }
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
    <div className="cgl-shell">
      {/* 左侧固定的高级质感导航侧栏 */}
      <aside className="cgl-sidebar">
        <div className="cgl-brand">{config?.site_name || 'Visionary AI'}</div>
        
        <button
          type="button"
          className="cgl-sidebar-action"
          onClick={() => setWorksOpen(true)}
        >
          <span className="action-icon">♦</span>
          <span className="action-label">我的作品</span>
        </button>
        
        <a className="cgl-sidebar-action" href="/explore">
          <span className="action-icon">✦</span>
          <span className="action-label">灵感广场</span>
        </a>
        
        <a className="cgl-sidebar-action" href="/templates">
          <span className="action-icon">✧</span>
          <span className="action-label">提示词模板</span>
        </a>
        
        <div className="cgl-sidebar-spacer" />
        
        <div className="cgl-sidebar-user">
          <HeroLogin />
        </div>
      </aside>

      {/* 右侧中央对话流布局主栏 */}
      <main className={`cgl-main${generating || activeTaskId ? ' cgl-generating' : ''}`}>
        <header className="cgl-header">
          <h1>{config?.hero_title || '开始一段创作'}</h1>
          <p>{config?.hero_subtitle || '描述你想要的画面，让 AI 帮你呈现。'}</p>
        </header>

        <section className="cgl-mode">
          <ModeCards />
        </section>

        <section className="cgl-stage">
          <GenerationStage />
        </section>

        <section className="cgl-composer">
          <Composer />
        </section>
      </main>

      <TaskBall />
      <MyWorksModal open={worksOpen} onClose={() => setWorksOpen(false)} />

      {/* 全局图片拖入叠加遮罩层 */}
      {dropVisible && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">
            <div className="drop-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2"/>
                <circle cx="12" cy="13" r="4"/>
                <path d="M2 6l3-3h4l2 3"/>
              </svg>
            </div>
            <div className="drop-title">释放以上传图片</div>
            <div className="drop-sub">支持拖拽最多 4 张图片</div>
          </div>
        </div>
      )}
    </div>
  )
}
