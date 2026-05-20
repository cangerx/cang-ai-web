'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useGeneratorStore } from '@/stores/generator'
import { SubPageLayout } from '@/components/layout/SubPageLayout'

interface ExploreItem {
  id: number
  image_url: string
  prompt: string
  model: string
  size?: string
}

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const { setPrompt, setMode } = useGeneratorStore()
  const router = useRouter()

  useEffect(() => {
    api.get('/explore', { params: { per_page: 40 } })
      .then(({ data }) => {
        const raw = data.items || data.data || []
        setItems(Array.isArray(raw) ? raw.map((it: any) => ({
          id: it.task_id || it.id,
          image_url: it.thumb || it.image_url || (it.images && it.images[0]) || '',
          prompt: it.prompt || '',
          model: it.model_name || it.model || '',
          size: it.size,
        })) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const closeLb = () => setLbIdx(null)
  const lbPrev = () => setLbIdx((p) => p !== null ? (p - 1 + items.length) % items.length : null)
  const lbNext = () => setLbIdx((p) => p !== null ? (p + 1) % items.length : null)

  const handleCopy = () => {
    if (lbIdx === null) return
    navigator.clipboard.writeText(items[lbIdx].prompt || '')
  }

  const handleDownload = () => {
    if (lbIdx === null) return
    const a = document.createElement('a')
    a.href = items[lbIdx].image_url; a.download = ''; a.target = '_blank'; a.click()
  }

  const handleUse = () => {
    if (lbIdx === null) return
    setPrompt(items[lbIdx].prompt || '')
    setMode('text')
    closeLb()
    router.push('/')
  }

  const lbItem = lbIdx !== null ? items[lbIdx] : null

  return (
    <SubPageLayout>
      <div className="sub-header">
        <div className="sub-header-text">
          <h1>灵感广场</h1>
          <p>从社区作品中获取创作灵感，点击图片查看完整提示词</p>
        </div>
      </div>

      {loading ? (
        <div className="sub-loading">加载中</div>
      ) : items.length === 0 ? (
        <div className="sub-empty">
          <span className="sub-empty-icon">✦</span>
          <span>暂无公开作品</span>
        </div>
      ) : (
        <div className="sub-masonry">
          {items.map((item, i) => (
            <div key={item.id} className="sub-masonry-item" onClick={() => setLbIdx(i)} style={{ cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.prompt} loading="lazy" />
              <div className="sub-masonry-overlay">
                <p>{item.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lbItem && (
        <div className="gallery-lb open" onClick={closeLb}>
          <div className="gallery-lb-inner" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-lb-img">
              <button className="gallery-lb-close" onClick={closeLb}>✕</button>
              <button className="gallery-lb-nav prev" onClick={lbPrev}>‹</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lbItem.image_url} alt="" />
              <button className="gallery-lb-nav next" onClick={lbNext}>›</button>
              <div className="gallery-lb-dots">
                {items.slice(0, 20).map((_, i) => (
                  <span key={i} className={i === lbIdx ? 'active' : ''} onClick={() => setLbIdx(i)} />
                ))}
                {items.length > 20 && <span style={{ opacity: 0.4 }}>…</span>}
              </div>
            </div>
            <div className="gallery-lb-info">
              <div className="gallery-lb-prompt">{lbItem.prompt}</div>
              <div className="gallery-lb-meta">
                {lbItem.model && <span>{lbItem.model}</span>}
                {lbItem.size && <span>{lbItem.size}</span>}
              </div>
              <div className="gallery-lb-actions">
                <button onClick={handleCopy}>复制</button>
                <button onClick={handleDownload}>下载</button>
                <button className="primary" onClick={handleUse}>使用</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SubPageLayout>
  )
}
