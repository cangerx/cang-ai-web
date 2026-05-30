'use client'

import '../styles/main.css'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useSiteStore } from '@/stores/site'
import { useGeneratorStore } from '@/stores/generator'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { HeroLogin } from '@/components/home/HeroLogin'
import { GenerationStage } from '@/components/home/GenerationStage'
import { GalleryGrid } from '@/components/home/GalleryGrid'
import { TaskBall } from '@/components/home/TaskBall'
import { MyWorksModal } from '@/components/home/MyWorksModal'
import { toast } from '@/components/ui/Toaster'
import { getModelDisplayName } from '@/lib/model-display'
import { uploadImage } from '@/lib/image-upload'
import api from '@/lib/api'

const TEMPLATE_CARDS = [
  { title: '烟花迪士尼', uses: '6.6万人使用', cover: '/ghiblio/disney_cat.png' },
  { title: '手绘风PLOG', uses: '0.69万人使用', cover: '/ghiblio/winter_girl.png' },
  { title: '软线稿贴纸', uses: '0.78万人使用', cover: '/ghiblio/stickers.png' },
  { title: '卡通头像', uses: '2.9万人使用', cover: '/ghiblio/cartoon_avatar.png' },
  { title: '涂鸦头像', uses: '2.5万人使用', cover: '/ghiblio/sketch_avatar.png' },
  { title: '史诗感海报', uses: '0.9万人使用', cover: '/ghiblio/epic_poster.png' },
]

const STYLE_CARDS = [
  { title: '春日电影感', badge: '新品', cover: '/ghiblio/winter_girl.png' },
  { title: '小红书封面', badge: '新品', cover: '/ghiblio/disney_cat.png' },
  { title: '日系动漫', cover: '/ghiblio/sketch_avatar.png' },
  { title: '清新插画', cover: '/ghiblio/stickers.png' },
  { title: '复古漫画', cover: '/ghiblio/epic_poster.png' },
  { title: '泡泡潮玩', cover: '/ghiblio/cartoon_avatar.png' },
]

const QUICK_PROMPTS = [
  '巨型流管护肤品广告',
  'Istanbul 3x3 旅行风格',
  'Pixar 3D 街头角色',
]

const QUALITY_LABELS: Record<string, string> = { low: '1K 标准', medium: '2K 高清', high: '4K 超清' }

const GHIBLIO_STYLES = [
  { name: '清新吉卜力', prompt: 'classic Ghibli anime style, warm nostalgic lighting, watercolor painting feel, clean detailed scenery' },
  { name: '复古胶片感', prompt: 'nostalgic retro anime film aesthetic, vintage Polaroid film scan, warm sunbeam rays, cinematic' },
  { name: '水彩手绘风', prompt: 'exquisite watercolor and ink sketch illustration, delicate hand-drawn outlines, soft pastel wash background' },
  { name: '3D潮玩盲盒', prompt: '3D cute pop toy doll style, clay material, soft studio lighting, vivid glossy pastel colors, high-res' },
  { name: '黑白漫风格', prompt: 'retro Japanese black and white manga sketch style, clean cross-hatching shade lines, dramatic contrast' },
]

export default function HomePage() {
  const { config, fetchConfig } = useSiteStore()
  const {
    generating, mode, setMode, setFiles, files, activeTaskId, setActiveTaskId,
    prompt, setPrompt, model, setModel, size, setSize, quality, setQuality,
    count, setCount, setGenerating,
  } = useGeneratorStore()
  const { setAuth, fetchMe, user } = useAuthStore()
  const { openSettings } = useUIStore()

  const [worksOpen, setWorksOpen] = useState(false)
  const [dropVisible, setDropVisible] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<'model' | 'style' | 'size' | 'quality' | 'count' | null>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    fetchConfig()
    fetchMe?.()
  }, [fetchConfig, fetchMe])

  useEffect(() => {
    if (config?.site_name) {
      document.title = `${config.site_name} - ${config.site_description || '一站式AI艺术与视频创作平台'}`
    }
  }, [config])

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
  }, [setAuth])

  useEffect(() => {
    if (activeTaskId) localStorage.setItem('active_task_id', activeTaskId)
    else localStorage.removeItem('active_task_id')
  }, [activeTaskId])

  useEffect(() => {
    const saved = localStorage.getItem('active_task_id')
    if (saved && !activeTaskId) setActiveTaskId(saved)
  }, [])

  // Automatically select the first available model if none selected
  useEffect(() => {
    if (config?.models?.length && !model) {
      setModel(config.models[0].id)
    }
  }, [config, model, setModel])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDropVisible(true)
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
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
    if (mode !== 'image') setMode('image')
    setFiles(droppedFiles.slice(0, 4))
  }, [mode, setMode, setFiles])

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

  // Credit calculation
  const currentModelConfig = config?.models?.find((m) => m.id === model)
  const availableSizes = currentModelConfig?.sizes?.length ? currentModelConfig.sizes : ['1:1', '3:4', '4:3', '16:9', '9:16']
  const availableQualities = currentModelConfig?.qualities?.length ? currentModelConfig.qualities : ['low', 'medium', 'high']
  const currentModelName = getModelDisplayName(model, config?.models || [], '模型') || currentModelConfig?.name || '模型'

  const costPerImage = useMemo(() => {
    if (!config?.billing_rules?.length) return config?.cost_per_generation || 1
    const rule = config.billing_rules.find((r) =>
      (r.model === '*' || r.model === model) && (r.quality === '*' || r.quality === quality)
    ) || config.billing_rules.find((r) => r.model === '*' && r.quality === '*')
    return rule?.credits || config?.cost_per_generation || 1
  }, [config, model, quality])
  const totalCost = costPerImage * count

  // Generate Image handler
  const handleGenerate = async () => {
    if (!user) { openSettings(); return }
    if ((user.credits ?? 0) < totalCost) {
      toast('积分不足，请充值', 'error')
      openSettings()
      return
    }
    const hasReferenceFiles = files.length > 0
    if (mode === 'image' && !hasReferenceFiles) return toast('请先上传参考图片', 'error')
    if (!prompt.trim() && mode === 'text' && !hasReferenceFiles) return toast('请输入提示词', 'error')
    setGenerating(true)

    try {
      const imageUrls: string[] = []
      if (hasReferenceFiles) {
        for (const file of files) {
          try {
            const uploadedUrl = await uploadImage(file)
            if (!uploadedUrl) throw new Error('图片上传失败，请重试')
            imageUrls.push(uploadedUrl)
          } catch (uploadErr: any) {
            toast(uploadErr?.response?.data?.message || uploadErr?.message || '图片上传失败，请重试', 'error')
            setGenerating(false)
            return
          }
        }
      }

      let finalPrompt = prompt.trim()
      if (imageUrls.length > 0 && finalPrompt) {
        finalPrompt = `参考上传的图片作为基础，${finalPrompt}`
      } else if (imageUrls.length > 0 && !finalPrompt) {
        finalPrompt = '参考上传的图片，生成一张风格和内容相似 of 的图片'
      }

      const { data } = await api.post('/apps/image-gen/generate', {
        prompt: finalPrompt,
        model,
        mode: imageUrls.length > 0 ? 'image' : 'text',
        size,
        quality,
        count,
        public: true,
        file_urls: imageUrls.length > 0 ? imageUrls : undefined,
      })

      setActiveTaskId(data.task_id)
      toast('任务已提交', 'success')
    } catch (err: any) {
      toast(err.response?.data?.message || err.response?.data?.error || '提交失败', 'error')
      setGenerating(false)
    }
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
          <a className="ghiblio-logo" href="/" title={config?.site_description || 'AI 智能艺术绘画平台'}>
            <span className="ghiblio-logo-text">{config?.site_name || 'Visionary AI'}</span>
          </a>
          <div className="ghiblio-nav-main">
            <a href="/" className="active">首页</a>
            <a href="/templates">模板广场</a>
            <a href="/explore">灵感探索</a>
            <a href="/pricing">积分充值</a>
            <a href="/distribution">分销推广</a>
            <button type="button" onClick={() => setWorksOpen(true)}>我的作品</button>
          </div>
          <div className="ghiblio-nav-actions">
            <a className="upgrade" href="/pricing">升级会员</a>
            <button className="language" type="button">🌐 简体中文</button>
            <HeroLogin />
          </div>
        </nav>

        {/* Click away overlay for popover dropdowns */}
        {activeDropdown && (
          <div className="dropdown-overlay-detector" onClick={() => setActiveDropdown(null)} />
        )}

        <div className="ghiblio-hero-content">
          <a className="ghiblio-model-link" href="/pricing">✨ Seedance 2.0 现已上线 ➔</a>
          <h1>{config?.hero_title || '一站式AI艺术与视频创作平台'}</h1>
          <div className="ghiblio-type-switch">
            <button className="active" type="button">图片生成</button>
            <button type="button">视频生成</button>
          </div>

          {/* CUSTOM PRECISE COMPOSER CONTAINER */}
          <section id="ghiblio-generator" className="ghiblio-composer-panel">
            <div className="ghiblio-composer-tabs">
              <button
                type="button"
                className={mode === 'text' && count === 1 ? 'active' : ''}
                onClick={() => { setMode('text'); setCount(1) }}
              >
                文生图
              </button>
              <button
                type="button"
                className={mode === 'image' ? 'active' : ''}
                onClick={() => { setMode('image') }}
              >
                图生图
              </button>
              <button
                type="button"
                className={mode === 'text' && count > 1 ? 'active' : ''}
                onClick={() => { setMode('text'); setCount(4) }}
              >
                批量生图
              </button>
            </div>

            <div className="ghiblio-composer-body">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入要求，AI生成图片"
                className="ghiblio-composer-textarea"
              />

              {mode === 'image' && (
                <div className="ghiblio-composer-upload-area">
                  {files.map((file, i) => (
                    <div key={i} className="ghiblio-composer-upload-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="" />
                      <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                  ))}
                  {files.length < 4 && (
                    <label className="ghiblio-composer-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])].slice(0, 4))}
                        className="hidden"
                      />
                      <span>+ 上传图片</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Dropdown selectors row */}
            <div className="ghiblio-composer-options">
              {/* Model select */}
              <div className="ghiblio-dropdown-wrap">
                <button
                  type="button"
                  className={`ghiblio-option-btn ${activeDropdown === 'model' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')}
                >
                  ⚙️ {currentModelName} <span>ˇ</span>
                </button>
                {activeDropdown === 'model' && (
                  <div className="ghiblio-dropdown-popover">
                    {(config?.models || []).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={model === m.id ? 'selected' : ''}
                        onClick={() => { setModel(m.id); setActiveDropdown(null) }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Style preset */}
              <div className="ghiblio-dropdown-wrap">
                <button
                  type="button"
                  className={`ghiblio-option-btn ${activeDropdown === 'style' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}
                >
                  🚫 自定义风格 <span>ˇ</span>
                </button>
                {activeDropdown === 'style' && (
                  <div className="ghiblio-dropdown-popover">
                    {GHIBLIO_STYLES.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          const separator = prompt.trim() ? ', ' : ''
                          setPrompt(`${prompt}${separator}${s.prompt}`)
                          toast(`已应用 "${s.name}" 风格提示词`, 'success')
                          setActiveDropdown(null)
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Aspect Ratio select */}
              <div className="ghiblio-dropdown-wrap">
                <button
                  type="button"
                  className={`ghiblio-option-btn ${activeDropdown === 'size' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
                >
                  🗂️ {size === 'auto' ? '自动' : size} <span>ˇ</span>
                </button>
                {activeDropdown === 'size' && (
                  <div className="ghiblio-dropdown-popover">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={size === s ? 'selected' : ''}
                        onClick={() => { setSize(s); setActiveDropdown(null) }}
                      >
                        {s === 'auto' ? '自动尺寸' : s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality select */}
              <div className="ghiblio-dropdown-wrap">
                <button
                  type="button"
                  className={`ghiblio-option-btn ${activeDropdown === 'quality' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'quality' ? null : 'quality')}
                >
                  ⇆ {QUALITY_LABELS[quality] || quality} <span>ˇ</span>
                </button>
                {activeDropdown === 'quality' && (
                  <div className="ghiblio-dropdown-popover">
                    {availableQualities.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={quality === q ? 'selected' : ''}
                        onClick={() => { setQuality(q); setActiveDropdown(null) }}
                      >
                        {QUALITY_LABELS[q] || q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Count select */}
              <div className="ghiblio-dropdown-wrap">
                <button
                  type="button"
                  className={`ghiblio-option-btn ${activeDropdown === 'count' ? 'active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === 'count' ? null : 'count')}
                >
                  ⚙️ {count}次 <span>ˇ</span>
                </button>
                {activeDropdown === 'count' && (
                  <div className="ghiblio-dropdown-popover">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={count === n ? 'selected' : ''}
                        onClick={() => { setCount(n); setActiveDropdown(null) }}
                      >
                        生成 {n} 张
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="ghiblio-option-btn-more">•••</button>
            </div>
          </section>

          {/* Quick chips below card container */}
          <div className="ghiblio-composer-bottom-row">
            <button
              type="button"
              className="ghiblio-composer-reload-btn"
              onClick={() => {
                const randomPrompt = QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)]
                setPrompt(randomPrompt)
                toast('已随机推荐提示词', 'success')
              }}
            >
              ↻
            </button>
            <div className="ghiblio-composer-chips">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`ghiblio-composer-chip ${prompt === item ? 'active' : ''}`}
                  onClick={() => fillPrompt(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`ghiblio-composer-submit-btn ${generating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? '生成中' : `生成 (${totalCost} 积分) ➔`}
            </button>
          </div>

          <div className="ghiblio-stage-wrapper">
            <GenerationStage />
          </div>
        </div>

        <div className="ghiblio-down">⌄</div>
      </section>



      <TaskBall />
      <MyWorksModal open={worksOpen} onClose={() => setWorksOpen(false)} />

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
    </main>
  )
}
