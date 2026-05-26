'use client'

import '../styles/main.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSiteStore } from '@/stores/site'
import { useGeneratorStore } from '@/stores/generator'
import { useAuthStore } from '@/stores/auth'
import { HeroLogin } from '@/components/home/HeroLogin'
import { Composer } from '@/components/home/Composer'
import { GenerationStage } from '@/components/home/GenerationStage'
import { GalleryGrid } from '@/components/home/GalleryGrid'
import { TaskBall } from '@/components/home/TaskBall'
import { MyWorksModal } from '@/components/home/MyWorksModal'

const TEMPLATE_CARDS = [
  { title: '烟花猫咪', uses: '6.6万人使用', tone: 'night', icon: '🐱' },
  { title: '手绘风PLOG', uses: '0.8万人使用', tone: 'snow', icon: '🏔️' },
  { title: '软线稿贴纸', uses: '0.7万人使用', tone: 'sketch', icon: '✍️' },
  { title: '卡通头像', uses: '2.9万人使用', tone: 'pink', icon: '🌷' },
  { title: '涂鸦头像', uses: '2.5万人使用', tone: 'garden', icon: '💐' },
  { title: '史诗海报', uses: '0.8万人使用', tone: 'poster', icon: '🎞️' },
]

const STYLE_CARDS = [
  { title: '春日电影感', badge: '新品', tone: 'spring' },
  { title: '小红书封面', badge: '新品', tone: 'cover' },
  { title: '日系动漫', tone: 'anime' },
  { title: '清新插画', tone: 'field' },
  { title: '复古漫画', tone: 'comic' },
  { title: '泡泡潮玩', tone: 'pop' },
]

const MODE_TABS = [
  { key: 'text' as const, label: '文生图' },
  { key: 'image' as const, label: '图生图' },
  { key: 'reverse' as const, label: '提示词反推' },
]

const QUICK_PROMPTS = [
  '巨型浮空城堡产品广告',
  '夏日海边 Polaroid 复古写真',
  '绝美妹妹头像包（meme 系）',
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
    document.getElementById('ghiblio-generator')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <main className={`ghiblio-page${generating || activeTaskId ? ' is-generating' : ''}`}>
      <section className="ghiblio-hero-scene">
        <div className="ghiblio-bg-paint">
          <span className="tree tree-left" />
          <span className="tree tree-right" />
          <span className="cloud cloud-one" />
          <span className="cloud cloud-two" />
          <span className="cloud cloud-three" />
          <span className="hill hill-back" />
          <span className="hill hill-mid" />
          <span className="hill hill-front" />
        </div>

        <nav className="ghiblio-topbar">
          <a className="ghiblio-logo" href="/">
            <span>🧸</span>
          </a>
          <div className="ghiblio-nav-main">
            <a href="/">首页</a>
            <a href="/templates">AI工具⌄</a>
            <a href="/templates">模型 <b>New</b>⌄</a>
            <a href="#hot-templates">模板广场</a>
            <a href="#hot-styles">灵感社区</a>
            <a href="/pricing">提示词库⌄</a>
            <button type="button" onClick={() => setWorksOpen(true)}>我的作品</button>
          </div>
          <div className="ghiblio-nav-actions">
            <a className="upgrade" href="/pricing">升级会员</a>
            <button className="language" type="button">🌐 简体中文</button>
            <HeroLogin />
          </div>
        </nav>

        <div className="ghiblio-hero-content">
          <a className="ghiblio-model-link" href="/pricing">✨ GPT Image 2 现已上线 →</a>
          <h1>{config?.hero_title || '一站式AI艺术与视频创作平台'}</h1>
          <div className="ghiblio-type-switch">
            <button className="active" type="button">图片生成</button>
            <button type="button">视频生成</button>
          </div>

          <section id="ghiblio-generator" className="ghiblio-generator">
            <div className="ghiblio-mode-tabs">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={mode === tab.key ? 'active' : ''}
                  onClick={() => setMode(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <GenerationStage />
            <Composer />
          </section>

          <div className="ghiblio-quick-row">
            <button type="button" className="circle-tool">↻</button>
            {QUICK_PROMPTS.map((item) => (
              <button key={item} type="button" onClick={() => fillPrompt(item)}>{item}</button>
            ))}
          </div>
        </div>

        <div className="ghiblio-down">⌄</div>
      </section>

      <section className="ghiblio-black-section">
        <div className="ghiblio-content-wrap">
          <section id="hot-templates" className="ghiblio-showcase">
            <div className="ghiblio-section-head">
              <div>
                <h2>热门AI模板</h2>
                <div className="ghiblio-filter-tabs">
                  <button className="active" type="button">全部</button>
                  <button type="button">宠物</button>
                  <button type="button">人物</button>
                  <button type="button">我的收藏</button>
                </div>
              </div>
              <a href="/templates">全部模板 →</a>
            </div>
            <div className="ghiblio-card-row">
              {TEMPLATE_CARDS.map((card) => (
                <article key={card.title} className="ghiblio-template-card">
                  <div className={`ghiblio-card-art tone-${card.tone}`}>
                    <span>{card.icon}</span>
                  </div>
                  <div className="ghiblio-card-body">
                    <div className="ghiblio-card-title">
                      <strong>{card.title}</strong>
                      <span>{card.uses}</span>
                    </div>
                    <div className="ghiblio-card-actions">
                      <button type="button" onClick={() => fillPrompt(card.title)}>制作同款</button>
                      <button type="button">作品集</button>
                      <button type="button">☆</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="hot-styles" className="ghiblio-showcase">
            <div className="ghiblio-section-head">
              <div>
                <h2>热门风格</h2>
                <div className="ghiblio-filter-tabs">
                  <button className="active" type="button">全部</button>
                  <button type="button">小红书</button>
                  <button type="button">穿搭</button>
                  <button type="button">头像</button>
                  <button type="button">经典动画</button>
                  <button type="button">艺术风格</button>
                </div>
              </div>
              <a href="/explore">全部风格 →</a>
            </div>
            <div className="ghiblio-style-grid">
              {STYLE_CARDS.map((card) => (
                <button key={card.title} type="button" className={`ghiblio-style-card tone-${card.tone}`} onClick={() => fillPrompt(card.title)}>
                  {card.badge && <span>{card.badge}</span>}
                  <strong>{card.title}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="ghiblio-gallery-strip">
            <GalleryGrid />
          </section>
        </div>
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
