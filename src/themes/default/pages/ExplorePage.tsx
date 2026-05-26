'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { downloadImage } from '@/lib/download'
import { getModelDisplayName } from '@/lib/model-display'
import { getTaskImageUrls } from '@/lib/task-images'
import { useGeneratorStore } from '@/stores/generator'
import { useSiteStore } from '@/stores/site'
import { SubPageLayout } from '@/components/layout/SubPageLayout'

interface ExploreItem {
  id: string | number
  image_url: string
  images: string[]
  prompt: string
  model: string
  size?: string
}

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const [lbImgIdx, setLbImgIdx] = useState(0)
  const { setPrompt, setMode } = useGeneratorStore()
  const models = useSiteStore((state) => state.config?.models || [])
  const router = useRouter()

  useEffect(() => {
    api.get('/explore', { params: { per_page: 40 } })
      .then(({ data }) => {
        const raw = data.items || data.data || []
        setItems(Array.isArray(raw) ? raw.map((it: any) => {
          const images = getTaskImageUrls(it)
          return {
            id: it.task_id || it.id,
            image_url: images[0] || '',
            images,
            prompt: it.prompt || '',
            model: it.model_name || it.model || '',
            size: it.size,
          }
        }).filter((it) => it.image_url) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const closeLb = () => setLbIdx(null)
  const lbPrev = () => setLbImgIdx((p) => lbItem ? (p - 1 + lbItem.images.length) % lbItem.images.length : p)
  const lbNext = () => setLbImgIdx((p) => lbItem ? (p + 1) % lbItem.images.length : p)

  const handleCopy = () => {
    if (lbIdx === null) return
    navigator.clipboard.writeText(items[lbIdx].prompt || '')
  }

  const handleDownload = () => {
    if (lbIdx === null) return
    downloadImage(items[lbIdx].images[lbImgIdx] || items[lbIdx].image_url)
  }

  const handleUse = () => {
    if (lbIdx === null) return
    setPrompt(items[lbIdx].prompt || '')
    setMode('text')
    closeLb()
    router.push('/')
  }

  const lbItem = lbIdx !== null ? items[lbIdx] : null
  const lbImageUrl = lbItem ? (lbItem.images[lbImgIdx] || lbItem.image_url) : ''

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
            <div key={item.id} className="sub-masonry-item" onClick={() => { setLbIdx(i); setLbImgIdx(0) }} style={{ cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.prompt} loading="lazy" />
              {item.images.length > 1 && <span className="sub-task-count">{item.images.length}张</span>}
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
              {lbItem.images.length > 1 && <button className="gallery-lb-nav prev" onClick={lbPrev}>‹</button>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lbImageUrl} alt="" />
              {lbItem.images.length > 1 && (
                <>
                  <button className="gallery-lb-nav next" onClick={lbNext}>›</button>
                  <div className="gallery-lb-dots">
                    {lbItem.images.map((_, i) => (
                      <span key={i} className={i === lbImgIdx ? 'active' : ''} onClick={() => setLbImgIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="gallery-lb-info">
              <div className="gallery-lb-prompt">{lbItem.prompt}</div>
              <div className="gallery-lb-meta">
                {getModelDisplayName(lbItem.model, models) && <span>{getModelDisplayName(lbItem.model, models)}</span>}
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
