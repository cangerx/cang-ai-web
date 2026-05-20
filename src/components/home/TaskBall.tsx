'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useGeneratorStore } from '@/stores/generator'
import api from '@/lib/api'

interface TaskItem {
  task_id: string
  status: string
  prompt: string
  images: string[]
  created_at: string
}

const STATUS_MAP: Record<string, string> = {
  processing: '生成中', completed: '已完成', failed: '失败', pending: '排队中', queued: '排队中',
}

export function TaskBall() {
  const { user } = useAuthStore()
  const { setActiveTaskId } = useGeneratorStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [processingCount, setProcessingCount] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [tipVisible, setTipVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/tasks', { params: { per_page: 10 } })
      const list: TaskItem[] = data.data || data
      setTasks(list)
      const pending = list.filter((t) => t.status === 'processing' || t.status === 'pending').length
      setProcessingCount(pending)
      setSpinning(pending > 0)
    } catch {}
  }, [user])

  useEffect(() => {
    fetchTasks()
    timerRef.current = setInterval(fetchTasks, 8000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchTasks])

  useEffect(() => {
    if (processingCount > 0 && !open) {
      setTipVisible(true)
      tipTimerRef.current = setTimeout(() => setTipVisible(false), 4000)
      return () => { if (tipTimerRef.current) clearTimeout(tipTimerRef.current) }
    }
  }, [processingCount, open])

  const handleOrbClick = () => {
    setTapped(true)
    setTimeout(() => setTapped(false), 400)
    setOpen(!open)
    setTipVisible(false)
  }

  if (!user) return null

  const badgeStatus = tasks.length > 0
    ? (tasks.some((t) => t.status === 'failed') ? 'failed' : tasks.some((t) => t.status === 'processing' || t.status === 'pending') ? 'processing' : 'completed')
    : null

  return (
    <>
      {open && (
        <div className="task-ball-backdrop" onClick={() => setOpen(false)} />
      )}
      <div className="task-ball">
        <div className={`orb-tip${tipVisible ? ' visible' : ''}`}>
          {processingCount > 0 ? `${processingCount} 个任务生成中` : ''}
        </div>

        <div className={`task-ball-panel${open ? ' open' : ''}`}>
          <div className="task-ball-panel-head">
            <h4>全部任务</h4>
            <button className="mini-ghost-btn" type="button" onClick={fetchTasks}>刷新</button>
          </div>
          <div className="task-ball-list">
            {tasks.length === 0 && (
              <div className="task-ball-empty">暂无任务</div>
            )}
            {tasks.map((t) => {
              const s = t.status
              return (
                <button
                  key={t.task_id}
                  className="task-ball-item"
                  type="button"
                  onClick={() => {
                    setActiveTaskId(t.task_id)
                    setOpen(false)
                    router.push('/')
                  }}
                >
                  <span className={`task-ball-dot ${s}`} />
                  <div className="task-ball-info">
                    <div className="task-ball-info-prompt">{t.prompt || '无描述'}</div>
                    <div className="task-ball-info-meta">{t.created_at}</div>
                  </div>
                  <span className={`task-ball-tag ${s}`}>{STATUS_MAP[s] || s}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          className={`task-ball-orb${tapped ? ' tapped' : ''}`}
          type="button"
          title="任务列表"
          onClick={handleOrbClick}
        >
          {spinning ? (
            <div className="orb-spinner spinning" />
          ) : (
            <span className="orb-icon">✦</span>
          )}
          {badgeStatus && <span className={`orb-badge ${badgeStatus}`} />}
        </button>
      </div>
    </>
  )
}
