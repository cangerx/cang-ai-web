'use client'

import '../styles/main.css'
import { useEffect, useState } from 'react'
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
 * 复用 default 模板的 Composer / GenerationStage / ModeCards 业务组件，
 * 只重排布局；其他页面（pricing / explore / 等）在 theme.config.ts
 * 中不注册时会 fallback 到 default 模板的同名页。
 */
export default function HomePage() {
  const { config, fetchConfig } = useSiteStore()
  const { generating, activeTaskId } = useGeneratorStore()
  const { fetchMe } = useAuthStore()
  const [worksOpen, setWorksOpen] = useState(false)

  useEffect(() => {
    fetchConfig()
    fetchMe?.()
  }, [fetchConfig, fetchMe])

  return (
    <div className="cgl-shell">
      <aside className="cgl-sidebar">
        <div className="cgl-brand">{config?.site_name || 'Visionary AI'}</div>
        <button
          type="button"
          className="cgl-sidebar-action"
          onClick={() => setWorksOpen(true)}
        >
          <span>♦</span> 我的作品
        </button>
        <a className="cgl-sidebar-action" href="/explore">
          <span>✦</span> 灵感广场
        </a>
        <a className="cgl-sidebar-action" href="/templates">
          <span>✧</span> 提示词模板
        </a>
        <div className="cgl-sidebar-spacer" />
        <div className="cgl-sidebar-user">
          <HeroLogin />
        </div>
      </aside>

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
    </div>
  )
}
