'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { downloadImage } from '@/lib/download'
import { getTaskImageUrls } from '@/lib/task-images'
import { toast } from '@/components/ui/Toaster'
import { SubPageLayout } from '@/components/layout/SubPageLayout'

interface TaskItem {
  url?: string
  image_url?: string
}

interface Task {
  id: string
  task_id: string
  status: string
  prompt: string
  model: string
  items?: TaskItem[]
  images?: Array<string | TaskItem>
  created_at: string
}

export default function TasksPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxTask, setLightboxTask] = useState<Task | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tasks')
      setTasks(data.data || data)
    } catch {
      toast('加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchTasks()
    else setLoading(false)
  }, [user])

  const handleDelete = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId))
      toast('已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  const renderContent = () => {
    if (!user) {
      return (
        <div className="sub-empty">
          <span className="sub-empty-icon">🔒</span>
          <span>请先登录后查看你的作品</span>
        </div>
      )
    }
    if (loading) return <div className="sub-loading">加载中</div>
    if (tasks.length === 0) {
      return (
        <div className="sub-empty">
          <span className="sub-empty-icon">♦</span>
          <span>还没有作品，去首页开始创作吧</span>
        </div>
      )
    }
    return (
      <div className="sub-grid">
        {tasks.map((task) => {
          const imageUrls = getTaskImageUrls(task)
          const coverUrl = imageUrls[0]

          return (
            <div key={task.task_id} className="sub-task-card">
              <button
                type="button" className="sub-task-del"
                onClick={() => handleDelete(task.task_id)}
                aria-label="删除"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                </svg>
              </button>
              {coverUrl ? (
                <button
                  type="button"
                  className="sub-task-img sub-task-img-btn"
                  onClick={() => { setLightboxTask(task); setLightboxIndex(0) }}
                >
                  <img src={coverUrl} alt={task.prompt} loading="lazy" />
                  {imageUrls.length > 1 && <span className="sub-task-count">{imageUrls.length}张</span>}
                </button>
              ) : (
                <div className="sub-task-img" />
              )}
              <div className="sub-task-body">
                <p className="sub-task-prompt">{task.prompt || '无提示词'}</p>
                <div className="sub-task-meta">
                  <span className={`sub-status-pill ${task.status === 'completed' ? 'completed' : task.status === 'failed' ? 'failed' : 'processing'}`}>
                    {task.status === 'completed' ? '完成' : task.status === 'failed' ? '失败' : '处理中'}
                  </span>
                  <span style={{ fontSize: 11, color: '#a1a1aa' }}>
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const lightboxImages = lightboxTask ? getTaskImageUrls(lightboxTask) : []
  const lightboxUrl = lightboxImages[lightboxIndex]

  return (
    <>
      <SubPageLayout>
        <div className="sub-header">
          <div className="sub-header-text">
            <h1>我的作品</h1>
            <p>所有由你生成的作品都会保存在这里</p>
          </div>
          {user && (
            <div className="sub-header-actions">
              <button type="button" className="sub-icon-btn" onClick={fetchTasks} aria-label="刷新">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M3 12a9 9 0 0 0 15 6.7L21 16M21 3v5h-5M3 21v-5h5"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </SubPageLayout>

      {lightboxTask && lightboxUrl && (
        <div className="gallery-lb open" onClick={() => setLightboxTask(null)}>
          <div className="gallery-lb-inner" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-lb-img">
              <button className="gallery-lb-close" type="button" onClick={() => setLightboxTask(null)}>✕</button>
              {lightboxImages.length > 1 && (
                <button className="gallery-lb-nav prev" type="button" onClick={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}>‹</button>
              )}
              <img src={lightboxUrl} alt="" />
              {lightboxImages.length > 1 && (
                <>
                  <button className="gallery-lb-nav next" type="button" onClick={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}>›</button>
                  <div className="gallery-lb-dots">
                    {lightboxImages.map((_, i) => (
                      <span key={i} className={i === lightboxIndex ? 'active' : ''} onClick={() => setLightboxIndex(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="gallery-lb-info">
              <div className="gallery-lb-prompt">{lightboxTask.prompt || '无提示词'}</div>
              <div className="gallery-lb-meta">
                <span>{lightboxIndex + 1}/{lightboxImages.length}</span>
              </div>
              <div className="gallery-lb-actions">
                <button type="button" onClick={() => navigator.clipboard.writeText(lightboxTask.prompt || '')}>复制</button>
                <button type="button" onClick={() => downloadImage(lightboxUrl)}>下载</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
