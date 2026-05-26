'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { useGeneratorStore } from '@/stores/generator'
import { useSiteStore } from '@/stores/site'
import api from '@/lib/api'
import { downloadImage } from '@/lib/download'
import { getModelDisplayName } from '@/lib/model-display'
import { getTaskImageUrls } from '@/lib/task-images'
import { toast } from '@/components/ui/Toaster'

const STATUS_LABELS: Record<string, string> = {
  idle: '未生成', processing: '生成中', done: '已完成', error: '失败',
}

const LOADING_BADGE_MSGS = [
  '正在提交任务', '连接服务器中', '排队中', '任务已接收',
  '正在生成', '模型运算中', 'GPU 加速中', '推理进行中',
  '神经网络运转中', '像素生成中', '图像解码中',
]

const LOADING_STATUS_MSGS = [
  '正在打草稿，用简单的线条勾勒出画面的大致轮廓和构图关系',
  '正在解读提示词语义，理解你想要什么背后的每一层含义',
  '构思中……想象画面的整体氛围，确定色调和情绪基调',
  '正在调用数十亿参数的神经网络，让 AI 看见你要的画面',
  '正在从上万种色彩中挑选配色方案，让画面和谐而不单调',
  '开始描绘主体，从最重要的视觉焦点开始落笔',
  '光线师到场——正在设计光源方向、强度和色温',
  '为物体表面添加纹理，让布料像布料、金属像金属',
  '调整构图的黄金比例，让视觉重心落在最舒服的位置',
  '正在统一风格调性，确保每个元素都属于同一个视觉世界',
  '放大到像素级别，精修边缘的每一个过渡和抗锯齿',
  '启动超分辨率算法，让画面每个角落都细腻满满',
  '进入最终润色阶段，像给照片加了一层精致的滤镜',
  '渲染背景的层次和景深，让远近关系更立体',
  '处理反射、折射和漫反射，让光影真实可信',
  '校准每一个像素的色彩准确度，避免色偏和失真',
  '在画面中添加环境细节，让场景更加丰富自然',
  '融合风格化效果，让整体画面有独特的艺术气息',
  '模型的数十亿个参数正在高速协同运算，全力以赴',
  '微调画面的视觉节奏，让元素之间的空间感更舒适',
  '构建空间透视关系，让画面有纵深感而不是一张平面',
  '生成流畅的曲线和有机的形体，避免生硬的边界',
  '打磨每一个颜色的自然过渡，不留任何突兀的色带',
  '进入尾声阶段，给每个元素做最后一遍质量检查',
  '将所有图层合并为一张完整的画，磨平接缝痕迹',
  '最终渲染开始，将内部表示转换为可见的像素矩阵',
  '执行后期处理：降噪、锐化、对比度微调，让画面干净透亮',
  '全局检查对称性和结构一致性，确保没有视觉缺陷',
  '打包最终结果，压缩优化后准备交付给你',
  '正在运行质量评分算法，确保输出达到预期标准',
  '正在同步全局风格一致性，让画面每个角落都和谐',
  '正在修复微小的视觉缺陷，保证输出完美无瑕',
  '为画面注入最后一丝灵气，让它从好看变为惊艳',
  'AI 正在反复审视自己的作品，像画家退后一步审视画布',
  '耐心等待……好的图片值得多等一会儿',
  '正在将随机噪声变成有意义的图像，这是扩散模型的魔法',
  '神经网络的注意力机制正在聚焦每一个关键细节',
  '正在将你的文字描述变成可见的视觉语言',
  '模型正在回忆它在数十亿张图片上学到的经验',
  '将想象力转化为像素，每个像素都经过精心计算',
  '像一位兢兢业业的画师，一笔一笔认真绘制',
]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const POLL_INTERVAL = 3000
const POLL_TIMEOUT = 30 * 60 * 1000
const MAX_CONSECUTIVE_ERRORS = 30

export const GenerationStage = memo(function GenerationStage() {
  const activeTaskId = useGeneratorStore((state) => state.activeTaskId)
  const setGenerating = useGeneratorStore((state) => state.setGenerating)
  const setActiveTaskId = useGeneratorStore((state) => state.setActiveTaskId)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [images, setImages] = useState<string[]>([])
  const [entered, setEntered] = useState<Set<number>>(new Set())
  const [taskPrompt, setTaskPrompt] = useState('')
  const [taskModel, setTaskModel] = useState('')
  const [taskSize, setTaskSize] = useState('')
  const [taskQuality, setTaskQuality] = useState('')
  const [taskCount, setTaskCount] = useState(1)
  const [info, setInfo] = useState('未生成图片')
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [badgeMsg, setBadgeMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollStartRef = useRef<number>(0)
  const errCountRef = useRef<number>(0)
  const msgTimersRef = useRef<ReturnType<typeof setInterval>[]>([])

  const stopLoadingMessages = useCallback(() => {
    msgTimersRef.current.forEach(clearInterval)
    msgTimersRef.current = []
  }, [])

  const startLoadingMessages = useCallback(() => {
    stopLoadingMessages()
    const badges = shuffleArray(LOADING_BADGE_MSGS)
    const statuses = shuffleArray(LOADING_STATUS_MSGS)
    let bIdx = 0, sIdx = 0
    setBadgeMsg(badges[0])
    setStatusMsg(statuses[0])
    msgTimersRef.current.push(
      setInterval(() => { bIdx = (bIdx + 1) % badges.length; setBadgeMsg(badges[bIdx]) }, 3000),
      setInterval(() => { sIdx = (sIdx + 1) % statuses.length; setStatusMsg(statuses[sIdx]) }, 6000),
    )
  }, [stopLoadingMessages])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    stopLoadingMessages()
  }, [stopLoadingMessages])

  useEffect(() => {
    if (!activeTaskId) return
    const snapshot = useGeneratorStore.getState()
    const modelOptions = useSiteStore.getState().config?.models || []
    setStatus('processing')
    setImages([])
    setEntered(new Set())
    setInfo('生成中...')
    setTaskPrompt(snapshot.prompt)
    setTaskModel(getModelDisplayName(snapshot.model, modelOptions))
    setTaskSize(snapshot.size)
    setTaskQuality(snapshot.quality)
    setTaskCount(snapshot.count || 1)
    pollStartRef.current = Date.now()
    errCountRef.current = 0
    startLoadingMessages()

    const poll = async () => {
      // 30-min hard timeout
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
        stopPolling()
        setStatus('error')
        setInfo('任务查询超时，请刷新页面或重新提交')
        setGenerating(false)
        toast('任务超时', 'error')
        return
      }

      try {
        const { data } = await api.get('/apps/image-gen/status', { params: { task_id: activeTaskId } })
        errCountRef.current = 0

        const task = data.task || data
        const taskStatus = task.status || data.status

        if (taskStatus === 'completed') {
          stopPolling()
          const imgs = getTaskImageUrls({ ...data, ...task })
          setImages(imgs)
          if (imgs.length > 0) setTaskCount(imgs.length)
          if (task.prompt) setTaskPrompt(task.prompt)
          if (task.model) {
            const modelLabel = getModelDisplayName(task.model, modelOptions)
            if (modelLabel) setTaskModel(modelLabel)
          }
          if (task.size) setTaskSize(task.size)
          setStatus('done')
          setInfo(`生成完成 · ${imgs.length} 张`)
          setGenerating(false)
          toast('生成完成！', 'success')
          imgs.forEach((_: string, i: number) => {
            setTimeout(() => setEntered((prev) => new Set(prev).add(i)), i * 150)
          })
          return
        }

        if (taskStatus === 'failed') {
          stopPolling()
          setStatus('error')
          setInfo(task.message || data.message || '生成失败')
          setGenerating(false)
          toast('生成失败', 'error')
          return
        }

        // Progressive results: show partial images while processing
        const partialUrls = getTaskImageUrls({ ...data, ...task })
        if (partialUrls.length > 0) {
          setImages(partialUrls)
          partialUrls.forEach((_: string, i: number) => {
            setTimeout(() => setEntered((prev) => new Set(prev).add(i)), i * 150)
          })
          const progress = task.progress || data.progress
          setInfo(progress ? `生成中 ${progress}...` : `已完成 ${partialUrls.length} 张，继续生成中...`)
        }

        pollRef.current = setTimeout(poll, POLL_INTERVAL)
      } catch {
        errCountRef.current++
        if (errCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling()
          setStatus('error')
          setInfo('网络连接异常，请检查网络后刷新页面')
          setGenerating(false)
          toast('网络异常', 'error')
          return
        }
        // Backoff on error: wait longer
        pollRef.current = setTimeout(poll, POLL_INTERVAL + errCountRef.current * 500)
      }
    }
    poll()
    return stopPolling
  }, [activeTaskId, setGenerating, stopPolling, startLoadingMessages])

  const handleClose = () => {
    stopPolling()
    setActiveTaskId('')
    setStatus('idle')
    setImages([])
    setLightboxIndex(null)
    setEntered(new Set())
    setInfo('未生成图片')
    setGenerating(false)
  }

  const handleRetry = async () => {
    if (!activeTaskId) return
    setStatus('processing')
    setInfo('重新查询中...')
    setGenerating(true)
    pollStartRef.current = Date.now()
    errCountRef.current = 0
    startLoadingMessages()
    // Re-query the same task — backend auto-retries stuck tasks
    try {
      const { data } = await api.get('/apps/image-gen/status', { params: { task_id: activeTaskId } })
      const task = data.task || data
      if (task.status === 'completed' || task.status === 'failed') {
        // Task already resolved, just re-trigger the effect
        setActiveTaskId('')
        setTimeout(() => setActiveTaskId(activeTaskId), 50)
      } else {
        // Still processing, polling will pick it up
        setActiveTaskId('')
        setTimeout(() => setActiveTaskId(activeTaskId), 50)
      }
    } catch {
      toast('重试失败', 'error')
      setGenerating(false)
      setStatus('error')
      stopPolling()
    }
  }

  const handleDownload = (url: string) => {
    downloadImage(url)
  }

  if (status === 'idle' && !activeTaskId) return null

  const tags = [taskModel, taskSize, taskQuality, `${taskCount}张`].filter(Boolean)
  const lightboxUrl = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      <article className="generation-stage open">
        <div className="section-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>生成结果</h2>
            <span className={`status ${status}`}>
              <span className="dot" />
              <span>{STATUS_LABELS[status]}</span>
            </span>
          </div>
          <button className="mini-ghost-btn" type="button" onClick={handleClose}>← 返回</button>
        </div>

        {taskPrompt && (
          <div className="stage-summary">
            <div className="stage-copy">
              <div
                className={`stage-prompt${promptExpanded ? ' expanded' : ''}`}
                onClick={() => setPromptExpanded(!promptExpanded)}
              >
                {taskPrompt}
              </div>
              {tags.length > 0 && (
                <div className="stage-tags">
                  {tags.map((t, i) => <span key={i} className="stage-tag">{t}</span>)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="preview-box">
          <div className="preview-grid">
            {status === 'processing' && (
              Array.from({ length: Math.max((taskCount || 1) - images.length, 0) }).map((_, i) => (
                <div key={`loading-${i}`} className="preview-item loading">
                  <div className="loading-shimmer" />
                  <div className="loading-grid" />
                  <div className="loading-orb orb-a" />
                  <div className="loading-orb orb-b" />
                  <div className="loading-line line-a" />
                  <div className="loading-line line-b" />
                  <div className="loading-badge">
                    <span className="badge-spinner" />
                    <span>{badgeMsg || '生成中'}</span>
                  </div>
                  <div className="loading-status">
                    <span className="status-text">{statusMsg || '正在生成图片'}</span>
                    <span className="status-dots" />
                  </div>
                </div>
              ))
            )}
            {images.map((url, i) => (
              <div key={`img-${i}`} className={`preview-item${entered.has(i) ? ' enter' : ''}`}>
                <img src={url} alt={`Result ${i + 1}`} onClick={() => setLightboxIndex(i)} />
              </div>
            ))}
            {images.length === 0 && status !== 'processing' && status !== 'error' && (
              <div className="placeholder">
                <strong>这里会显示生成结果</strong>
              </div>
            )}
          </div>
        </div>

        <div className="meta">
          <div style={{ fontSize: 12, color: '#71717a' }}>{info}</div>
          {status === 'error' && (
            <div className="task-lock" style={{ background: '#fef2f2', borderColor: '#fecaca', marginTop: 8 }}>
              <span className="task-lock-label" style={{ color: '#991b1b' }}>生成失败</span>
              <span />
              <span />
              <button className="ghost-btn" type="button" onClick={handleRetry} style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}>重新生成</button>
            </div>
          )}
          {images.length > 0 && (
            <div className="result-actions">
              {images.map((url, i) => (
                <a key={i} className="dl" href={url} target="_blank" rel="noopener" onClick={(e) => { e.preventDefault(); handleDownload(url) }}>
                  下载 #{i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </article>

      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          {images.length > 1 && (
            <button className="gallery-lb-nav prev" type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i === null ? 0 : (i - 1 + images.length) % images.length) }}>‹</button>
          )}
          <img src={lightboxUrl} alt="" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button className="gallery-lb-nav next" type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i === null ? 0 : (i + 1) % images.length) }}>›</button>
              <div className="gallery-lb-dots">
                {images.map((_, i) => (
                  <span key={i} className={i === lightboxIndex ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
})
