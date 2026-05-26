'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { downloadImage } from '@/lib/download'
import { getModelDisplayName } from '@/lib/model-display'
import { useGeneratorStore } from '@/stores/generator'
import { useSiteStore } from '@/stores/site'

interface GalleryItemData {
  id: number
  image_url: string
  prompt: string
  model: string
  size?: string
}

export function GalleryGrid() {
  const [items, setItems] = useState<GalleryItemData[]>([])
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const { setPrompt, setMode } = useGeneratorStore()
  const models = useSiteStore((state) => state.config?.models || [])

  useEffect(() => {
    api.get('/explore', { params: { per_page: 20 } })
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
  }, [])

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.classList.add('loaded')
    e.currentTarget.closest('.gallery-item')?.classList.add('img-loaded')
  }

  const openLb = (idx: number) => setLbIdx(idx)
  const closeLb = () => setLbIdx(null)
  const lbPrev = () => setLbIdx((prev) => prev !== null ? (prev - 1 + items.length) % items.length : null)
  const lbNext = () => setLbIdx((prev) => prev !== null ? (prev + 1) % items.length : null)

  const handleUse = () => {
    if (lbIdx === null) return
    const item = items[lbIdx]
    setPrompt(item.prompt || '')
    setMode('text')
    closeLb()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCopy = () => {
    if (lbIdx === null) return
    navigator.clipboard.writeText(items[lbIdx].prompt || '')
  }

  const handleDownload = () => {
    if (lbIdx === null) return
    downloadImage(items[lbIdx].image_url)
  }

  if (items.length === 0) return null

  const lbItem = lbIdx !== null ? items[lbIdx] : null

  return (
    <>
      <details className="gallery-card" open>
        <summary className="section-toggle">
          <span>灵感广场</span>
          <span className="toggle-arrow">›</span>
        </summary>
        <div className="gallery-grid">
          {items.map((item, i) => (
            <div key={item.id} className="gallery-item" onClick={() => openLb(i)}>
              <img src={item.image_url} alt={item.prompt} loading="lazy" onLoad={handleImgLoad} />
              {item.prompt && (
                <div className="gallery-overlay">
                  <p>{item.prompt}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>

      {lbItem && (
        <div className="gallery-lb open" onClick={closeLb}>
          <div className="gallery-lb-inner" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-lb-img">
              <button className="gallery-lb-close" onClick={closeLb}>✕</button>
              <button className="gallery-lb-nav prev" onClick={lbPrev}>‹</button>
              <img src={lbItem.image_url} alt="" />
              <button className="gallery-lb-nav next" onClick={lbNext}>›</button>
              <div className="gallery-lb-dots">
                {items.map((_, i) => (
                  <span key={i} className={i === lbIdx ? 'active' : ''} onClick={() => setLbIdx(i)} />
                ))}
              </div>
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
    </>
  )
}
