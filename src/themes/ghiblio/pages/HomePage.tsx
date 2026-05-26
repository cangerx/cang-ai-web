'use client'

import '../styles/main.css'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const EXAMPLE_PROMPTS = [
  '雨后森林里的小木屋，暖黄色窗光，水彩插画，治愈氛围',
  '戴草帽的猫咪邮差骑车穿过花田，童话绘本质感',
  '云朵上的小型咖啡馆，日落天空，柔和胶片色彩',
]

export default function HomePage() {
  const { config, fetchConfig } = useSiteStore()
  const {
    generating, mode, setMode, setFiles, files, activeTaskId, setActiveTaskId, setPrompt,
  } = useGeneratorStore()
  const { setAuth, fetchMe } = useAuthStore()
  const [worksOpen, setWorksOpen] = useState(false)
  const [dropVisible, setDropVisible] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    fetchConfig()
    fetchMe?.()
  }, [fetchConfig, fetchMe])

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
    if (authError) window.history.replaceState({}, '', '/')
  }, [setAuth])

  useEffect(() => {
    if (activeTaskId) localStorage.setItem('active_task_id', activeTaskId)
    else localStorage.removeItem('active_task_id')
  }, [activeTaskId])

  useEffect(() => {
    const saved = localStorage.getItem('active_task_id')
    if (saved && !activeTaskId) setActiveTaskId(saved)
  }, [])

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

  const fillPrompt = (value: string) => {
    setPrompt(value)
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className={`ghiblio-shell${generating || activeTaskId ? ' is-making' : ''}`}>
      <div className="ghiblio-sky" />
      <div className="ghiblio-grain" />
      <AnnounceBar />

      <nav className="ghiblio-nav">
        <a className="ghiblio-brand" href="/">
          <span className="ghiblio-brand-mark">✦</span>
          <span>{config?.site_name || 'Pix Studio'}</span>
        </a>
        <div className="ghiblio-nav-links">
          <a href="/explore">灵感社区</a>
          <a href="/templates">提示词模板</a>
          <a href="/pricing">定价</a>
        </div>
        <HeroLogin />
      </nav>

      <section className="ghiblio-hero">
        <div className="ghiblio-hero-copy">
          <div className="ghiblio-eyebrow">AI ART & IMAGE STUDIO</div>
          <h1>{config?.hero_title || '把一句想象，画成温柔的作品'}</h1>
          <p>{config?.hero_subtitle || '用文字、参考图和智能提示词工具创作插画、海报、头像和故事感画面。所有生成结果都能继续查看、下载和发布到灵感社区。'}</p>
          <div className="ghiblio-hero-actions">
            <a href="#studio" className="ghiblio-primary">开始创作</a>
            <button type="button" className="ghiblio-secondary" onClick={() => setWorksOpen(true)}>我的作品</button>
          </div>
          <div className="ghiblio-prompt-strip">
            {EXAMPLE_PROMPTS.map((text) => (
              <button key={text} type="button" onClick={() => fillPrompt(text)}>{text}</button>
            ))}
          </div>
        </div>

        <div className="ghiblio-story-card">
          <div className="ghiblio-art-frame">
            <div className="ghiblio-sun" />
            <div className="ghiblio-cloud cloud-a" />
            <div className="ghiblio-cloud cloud-b" />
            <div className="ghiblio-hill hill-a" />
            <div className="ghiblio-hill hill-b" />
            <div className="ghiblio-house">
              <span />
              <i />
            </div>
            <div className="ghiblio-path" />
          </div>
          <div className="ghiblio-story-meta">
            <span>文字生图</span>
            <span>参考图生成</span>
            <span>提示词反推</span>
          </div>
        </div>
      </section>

      <section className="ghiblio-capabilities">
        <article>
          <span>01</span>
          <strong>多模型生成</strong>
          <p>根据后台模型配置自动展示可用模型、尺寸、质量和张数。</p>
        </article>
        <article>
          <span>02</span>
          <strong>作品管理</strong>
          <p>生成后可查看多图结果，下载、复制提示词，并回到我的作品。</p>
        </article>
        <article>
          <span>03</span>
          <strong>灵感社区</strong>
          <p>公开作品进入社区画廊，同一任务内多张图可以连续浏览。</p>
        </article>
      </section>

      <section id="studio" className="ghiblio-studio">
        <div className="ghiblio-studio-head">
          <div>
            <span>创作工作台</span>
            <h2>选择方式，开始生成</h2>
          </div>
          <button type="button" onClick={() => setWorksOpen(true)}>查看我的作品</button>
        </div>
        <ModeCards />
        <GenerationStage />
        <Composer />
      </section>

      <section className="ghiblio-gallery-section">
        <GalleryGrid />
      </section>

      <Footer />
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
