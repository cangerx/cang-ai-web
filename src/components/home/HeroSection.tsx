'use client'

import Link from 'next/link'
import { useSiteStore } from '@/stores/site'

export function HeroSection() {
  const { config } = useSiteStore()

  return (
    <section className="text-center py-16 relative">
      <div className="text-5xl mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 0 20 2 2 0 0 1 0-4 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h1a10 10 0 0 0-5-11Z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1" fill="currentColor"/></svg></div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
        AI 智能绘画平台
      </h1>
      <p className="mt-3 text-gray-400 text-base max-w-md mx-auto">
        输入一句描述，AI 帮你生成高质量图片。支持文生图、图生图、提示词反推。
      </p>
      <Link
        href="/generate"
        className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
      >
        开始创作 →
      </Link>

      {config?.announcements?.length ? (
        <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100 text-sm text-gray-700">
          <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-semibold">公告</span>
          <span dangerouslySetInnerHTML={{ __html: config.announcements[0] }} />
        </div>
      ) : null}
    </section>
  )
}
