'use client'

import '../../ghiblio/styles/main.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useGeneratorStore } from '@/stores/generator'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import { HeroLogin } from '@/components/home/HeroLogin'
import { MyWorksModal } from '@/components/home/MyWorksModal'
import { TaskBall } from '@/components/home/TaskBall'
import { toast } from '@/components/ui/Toaster'

interface TemplateVar {
  name: string
  type: string
  label: string
  default: string
  description?: string
  alternatives?: string[]
}

interface Template {
  id: number
  title: string
  tags: string
  cover_image?: string
  preview_url?: string
  variables: TemplateVar[]
}

const CATEGORIES = ['全部', '人物', '宠物', '表情包', '风景建筑', '设计']

const TAGS = [
  '全部', '热门', '手办', '宠物出游', '宠物写真', '宠物艺术照', '宠物证件照', '宠物日常', 
  '宠物头像', '宠物节日照', '宠物圣诞', '宠物Cosplay', '写真', '头像', '3D人物', 
  '经典IP', '日本小人插画', '虚拟人物', '人物节日照', '人物圣诞', '日常', 
  '人物证件照', '建筑', '平面设计', '创意设计', '人物表情包'
]

const MODELS = [
  '全部', 'Nano Banana 2', 'Nano Banana Pro', 'Seedream 5.0 Lite', 'Seedream 4.5', 
  'Seedream 4.0', 'Nano Banana', 'GPT Image 2', 'GPT Image 1.5', 'Flux.1 Kontext Pro', 'Z-Image'
]

// Fallback high quality premium cover assets if the API doesn't return cover images
const STATIC_COVERS: Record<string, string> = {
  '烟花迪士尼': '/ghiblio/disney_cat.png',
  '手绘风PLOG': '/ghiblio/winter_girl.png',
  '软线稿贴纸': '/ghiblio/stickers.png',
  '卡通头像': '/ghiblio/cartoon_avatar.png',
  '涂鸦头像': '/ghiblio/sketch_avatar.png',
  '史诗感海报': '/ghiblio/epic_poster.png',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [activeTag, setActiveTag] = useState('全部')
  const [activeModel, setActiveModel] = useState('全部')
  const [selected, setSelected] = useState<Template | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [building, setBuilding] = useState(false)
  const [worksOpen, setWorksOpen] = useState(false)

  const { setPrompt, setMode } = useGeneratorStore()
  const { fetchMe } = useAuthStore()
  const { config, fetchConfig } = useSiteStore()
  const router = useRouter()

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    if (config?.site_name) {
      document.title = `${config.site_name} - ${config.site_description || '一站式AI艺术与视频创作平台'}`
    }
  }, [config])

  useEffect(() => {
    fetchMe?.()
    api.get('/templates', { params: { per_page: 50 } })
      .then(({ data }) => setTemplates(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchMe])

  const filtered = templates.filter((t) => {
    // 1. Category filter
    if (activeCategory !== '全部') {
      const match = t.tags?.includes(activeCategory) || t.title.includes(activeCategory)
      if (!match) return false
    }
    // 2. Tag filter
    if (activeTag !== '全部') {
      const match = t.tags?.includes(activeTag) || t.title.includes(activeTag)
      if (!match) return false
    }
    // 3. Model filter
    if (activeModel !== '全部') {
      const match = t.tags?.includes(activeModel) || t.title.includes(activeModel)
      if (!match) return false
    }
    return true
  })

  const openTemplate = (t: Template) => {
    setSelected(t)
    const init: Record<string, string> = {}
    ;(t.variables || []).forEach((v) => { init[v.name] = v.default || '' })
    setValues(init)
  }

  const handleBuild = async () => {
    if (!selected) return
    setBuilding(true)
    try {
      const { data } = await api.post(`/templates/${selected.id}/build`, { variables: values })
      if (data.prompt) {
        setPrompt(data.prompt)
        setMode('text')
        setSelected(null)
        toast('模板已应用', 'success')
        router.push('/')
      }
    } catch {
      toast('生成失败', 'error')
    } finally {
      setBuilding(false)
    }
  }

  return (
    <main className="ghiblio-page min-h-screen bg-[#070708] text-white">
      {/* Top Navbar */}
      <nav className="ghiblio-topbar">
        <a className="ghiblio-logo" href="/" title={config?.site_description || 'AI 智能艺术绘画平台'}>
          <span className="ghiblio-logo-text">{config?.site_name || 'Visionary AI'}</span>
        </a>
        <div className="ghiblio-nav-main">
          <a href="/">首页</a>
          <a href="/templates" className="active">模板广场</a>
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

      {/* Main Content Area */}
      <div className="ghiblio-content-wrap pt-20 px-4 max-w-[1240px] mx-auto pb-24">
        {/* Title */}
        <header className="mb-8 mt-4 text-left">
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <span>✨</span> 模板广场
          </h1>
        </header>

        {/* 3-Row Tag Filters */}
        <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 mb-8 flex flex-col gap-5 text-left text-sm text-gray-400">
          {/* Row 1: Category */}
          <div className="flex items-start gap-4">
            <span className="font-semibold text-white py-1 flex-shrink-0">分类筛选:</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Tags */}
          <div className="flex items-start gap-4">
            <span className="font-semibold text-white py-1 flex-shrink-0">标签筛选:</span>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeTag === tag 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Models */}
          <div className="flex items-start gap-4">
            <span className="font-semibold text-white py-1 flex-shrink-0">模型筛选:</span>
            <div className="flex flex-wrap gap-2">
              {MODELS.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeModel === mod 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveModel(mod)}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Template Grid */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-gray-400">暂无模板</div>
        ) : (
          <div className="ghiblio-card-row">
            {filtered.map((t) => {
              const cover = STATIC_COVERS[t.title] || t.cover_image || '/ghiblio/sketch_avatar.png'
              const uses = t.tags?.includes('热门') ? '6.6万人使用' : '1.2万人使用'
              return (
                <article key={t.id} className="ghiblio-template-card" onClick={() => openTemplate(t)}>
                  <div className="ghiblio-card-art cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={t.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                  </div>
                  <div className="ghiblio-card-body">
                    <div className="ghiblio-card-title">
                      <strong>{t.title}</strong>
                      <span>{uses}</span>
                    </div>
                    <div className="ghiblio-card-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); openTemplate(t) }}>制作同款</button>
                      <button type="button" onClick={(e) => e.stopPropagation()}>作品集</button>
                      <button type="button" onClick={(e) => e.stopPropagation()}>☆</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Variables Popup Modal */}
      {selected && (
        <div className="tpl-modal" onClick={() => setSelected(null)}>
          <div className="tpl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tpl-modal-header">
              <div>
                <h2 className="tpl-modal-title">{selected.title}</h2>
                <div className="tpl-modal-tags">
                  {(selected.tags || '').split(',').filter(Boolean).map((tag) => (
                    <span key={tag}>{tag.trim()}</span>
                  ))}
                </div>
              </div>
              <button className="tpl-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="tpl-modal-divider" />
            <div className="tpl-modal-form">
              {(selected.variables || []).map((v, idx) => (
                <div key={v.name} className="tpl-field">
                  <label className="tpl-field-label">
                    <span className="tpl-field-num">{idx + 1}</span>
                    {v.label}
                  </label>
                  {v.description && <p className="tpl-field-desc">{v.description}</p>}
                  <input
                    type="text"
                    className="tpl-field-input"
                    value={values[v.name] || ''}
                    placeholder={v.default}
                    onChange={(e) => setValues({ ...values, [v.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="tpl-modal-footer">
              <button
                className="tpl-modal-submit"
                disabled={building}
                onClick={handleBuild}
              >
                {building ? '生成中...' : '生成提示词并使用'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskBall />
      <MyWorksModal open={worksOpen} onClose={() => setWorksOpen(false)} />
    </main>
  )
}
