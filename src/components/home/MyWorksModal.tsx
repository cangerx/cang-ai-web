'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

interface TaskItem {
  url: string
}

interface Task {
  task_id: string
  prompt: string
  status: string
  items: TaskItem[]
  created_at: string
}

export function MyWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lbTask, setLbTask] = useState<Task | null>(null)
  const [lbImgIdx, setLbImgIdx] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/tasks', { params: { per_page: 30 } })
      const list: Task[] = (data.data || []).filter(
        (t: Task) => t.status === 'completed' && Array.isArray(t.items) && t.items.length > 0 && t.items[0]?.url
      )
      setTasks(list)
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  if (!open) return null

  return (
    <>
    <div className="myworks-modal" onClick={onClose}>
      <div className="myworks-overlay" />
      <div className="myworks-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="myworks-head">
          <h3>我的作品</h3>
          <button className="icon-btn" type="button" onClick={onClose}>×</button>
        </div>
        <div className="myworks-notice">图片仅保留 3 天，请及时下载保存。公开作品不受影响。</div>
        <div className="myworks-grid">
          {!token && <div className="myworks-empty">请先登录</div>}
          {token && loading && <div className="myworks-loading">加载中...</div>}
          {token && error && <div className="myworks-empty">{error}</div>}
          {token && !loading && !error && tasks.length === 0 && (
            <div className="myworks-empty">还没有作品，快去生成吧</div>
          )}
          {tasks.map((t) => {
            const img = t.items[0]
            const prompt = t.prompt || ''
            const displayPrompt = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt
            const time = t.created_at ? new Date(t.created_at).toLocaleDateString('zh-CN') : ''
            return (
              <div className="myworks-card" key={t.task_id} onClick={() => { setLbTask(t); setLbImgIdx(0) }} style={{ cursor: 'pointer' }}>
                <img src={img.url} alt="" loading="lazy" />
                <div className="myworks-card-body">
                  <div className="myworks-card-prompt">{displayPrompt}</div>
                  <div className="myworks-card-time">
                    {time}{t.items.length > 1 ? ` · ${t.items.length}张` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>

    {lbTask && createPortal(
      <div className="gallery-lb open" onClick={() => setLbTask(null)} style={{ zIndex: 10000 }}>
        <div className="gallery-lb-inner" onClick={(e) => e.stopPropagation()}>
          <div className="gallery-lb-img">
            <button className="gallery-lb-close" onClick={() => setLbTask(null)}>✕</button>
            {lbTask.items.length > 1 && (
              <button className="gallery-lb-nav prev" onClick={() => setLbImgIdx((p) => (p - 1 + lbTask.items.length) % lbTask.items.length)}>‹</button>
            )}
            <img src={lbTask.items[lbImgIdx]?.url} alt="" />
            {lbTask.items.length > 1 && (
              <button className="gallery-lb-nav next" onClick={() => setLbImgIdx((p) => (p + 1) % lbTask.items.length)}>›</button>
            )}
            {lbTask.items.length > 1 && (
              <div className="gallery-lb-dots">
                {lbTask.items.map((_, i) => (
                  <span key={i} className={i === lbImgIdx ? 'active' : ''} onClick={() => setLbImgIdx(i)} />
                ))}
              </div>
            )}
          </div>
          <div className="gallery-lb-info">
            <div className="gallery-lb-prompt">{lbTask.prompt || '无描述'}</div>
            <div className="gallery-lb-actions">
              <button onClick={() => { navigator.clipboard.writeText(lbTask.prompt || '') }}>复制提示词</button>
              <a href={lbTask.items[lbImgIdx]?.url} download="" target="_blank" rel="noopener noreferrer">
                <button type="button">下载</button>
              </a>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
