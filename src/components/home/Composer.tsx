'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import { useGeneratorStore } from '@/stores/generator'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toaster'
import { validateFile, uploadImage } from '@/lib/image-upload'

const QUALITY_LABELS: Record<string, string> = { low: '标清 1K', medium: '高清 2K', high: '超清 4K' }

const SIZE_ICONS: Record<string, { w: number; h: number; round?: boolean }> = {
  auto: { w: 16, h: 16, round: true },
  '1:1': { w: 16, h: 16 },
  '3:2': { w: 18, h: 12 }, '2:3': { w: 12, h: 18 },
  '16:9': { w: 21, h: 12 }, '9:16': { w: 12, h: 21 },
  '4:3': { w: 18, h: 14 }, '3:4': { w: 14, h: 18 },
  '5:4': { w: 18, h: 15 }, '4:5': { w: 15, h: 18 },
  '2:1': { w: 20, h: 10 }, '1:2': { w: 10, h: 20 },
  '3:1': { w: 21, h: 7 }, '1:3': { w: 7, h: 21 },
  '21:9': { w: 21, h: 9 },
}

const ALL_SIZES = Object.keys(SIZE_ICONS)
const ALL_QUALITIES = ['low', 'medium', 'high']
const MAX_FILES = 4

export function Composer() {
  const { user } = useAuthStore()
  const { config } = useSiteStore()
  const {
    mode, model, size, quality, count, prompt, files,
    setModel, setSize, setQuality, setCount, setPrompt, setFiles,
    setActiveTaskId, setGenerating, generating,
  } = useGeneratorStore()

  const [configOpen, setConfigOpen] = useState(false)
  const [toolLoading, setToolLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [removingIdx, setRemovingIdx] = useState<number | null>(null)
  const [hoverPreview, setHoverPreview] = useState<{ url: string; x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const thumbUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => thumbUrls.forEach(URL.revokeObjectURL), [thumbUrls])

  useEffect(() => {
    if (config?.models?.length && !model) {
      setModel(config.models[0].id)
    }
  }, [config, model, setModel])

  const currentModelConfig = config?.models?.find((m) => m.id === model)
  const availableSizes = currentModelConfig?.sizes?.length ? currentModelConfig.sizes : ALL_SIZES
  const availableQualities = currentModelConfig?.qualities?.length ? currentModelConfig.qualities : ALL_QUALITIES

  const modelName = currentModelConfig?.name || model || '模型'
  const configLabel = `${modelName} | ${size === 'auto' ? '自动' : size} | ${QUALITY_LABELS[quality] || quality} | ${count}张`

  const costPerImage = useMemo(() => {
    if (!config?.billing_rules?.length) return config?.cost_per_generation || 1
    const rule = config.billing_rules.find((r) =>
      (r.model === '*' || r.model === model) && (r.quality === '*' || r.quality === quality)
    ) || config.billing_rules.find((r) => r.model === '*' && r.quality === '*')
    return rule?.credits || config?.cost_per_generation || 1
  }, [config, model, quality])
  const totalCost = costPerImage * count

  const handlePromptTool = async (kind: 'optimize' | 'translate') => {
    if (!prompt.trim()) return toast('请先输入提示词', 'error')
    setToolLoading(true)
    try {
      const { data } = await api.post('/prompt-tool', { kind, prompt })
      if (data.prompt) setPrompt(data.prompt)
      toast(kind === 'optimize' ? '优化完成' : '翻译完成', 'success')
    } catch {
      toast('操作失败', 'error')
    } finally {
      setToolLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid: File[] = []
    for (const f of selected) {
      const err = validateFile(f)
      if (err) { toast(err, 'error'); continue }
      valid.push(f)
    }
    const currentMax = mode === 'reverse' ? 1 : MAX_FILES
    const merged = [...files, ...valid].slice(0, currentMax)
    setFiles(merged)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFile = (idx: number) => {
    setRemovingIdx(idx)
    setTimeout(() => {
      setFiles(files.filter((_, i) => i !== idx))
      setRemovingIdx(null)
    }, 180)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageFiles: File[] = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const err = validateFile(file)
          if (err) { toast(err, 'error'); continue }
          imageFiles.push(file)
        }
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      if (mode === 'text') {
        const { setMode } = useGeneratorStore.getState()
        setMode('image')
      }
      const limit = mode === 'text' ? MAX_FILES : (mode === 'reverse' ? 1 : MAX_FILES)
      const merged = [...files, ...imageFiles].slice(0, limit)
      setFiles(merged)
      toast(`已粘贴 ${imageFiles.length} 张图片`, 'success')
    }
  }

  const handleThumbHover = (e: React.MouseEvent, url: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setHoverPreview({ url, x: rect.left + rect.width / 2, y: rect.top })
  }

  const handleGenerate = async () => {
    if (!user) return toast('请先登录', 'error')
    if (mode === 'reverse') return handleReverse()
    if (!prompt.trim() && mode === 'text') return toast('请输入提示词', 'error')
    setGenerating(true)

    try {
      let imageUrl = ''
      if (mode === 'image' && files[0]) {
        imageUrl = await uploadImage(files[0])
      }

      let finalPrompt = prompt.trim()
      if (imageUrl && finalPrompt) {
        finalPrompt = `参考上传的图片作为基础，${finalPrompt}`
      } else if (imageUrl && !finalPrompt) {
        finalPrompt = '参考上传的图片，生成一张风格和内容相似的图片'
      }

      const { data } = await api.post('/apps/image-gen/generate', {
        prompt: finalPrompt,
        model,
        mode: imageUrl ? 'image' : 'text',
        size,
        quality,
        count,
        public: isPublic,
        file_urls: imageUrl ? [imageUrl] : undefined,
      })

      setActiveTaskId(data.task_id)
      toast('任务已提交', 'success')
    } catch (err: any) {
      toast(err.response?.data?.message || '提交失败', 'error')
      setGenerating(false)
    }
  }

  const imageToBase64 = (file: File, maxWidth = 1024, quality = 0.8): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('图片读取失败'))
      }
      img.src = url
    })

  const handleReverse = async () => {
    if (!files[0]) return toast('请上传图片', 'error')
    setGenerating(true)
    try {
      const base64 = await imageToBase64(files[0])
      const { data } = await api.post('/reverse-prompt', {
        image_url: base64,
        prompt: prompt.trim() || undefined,
      })
      if (data.prompt) {
        setPrompt(data.prompt)
        setFiles([])
        const { setMode } = useGeneratorStore.getState()
        setMode('text')
        toast('反推完成，提示词已填入', 'success')
        requestAnimationFrame(() => {
          const el = document.getElementById('prompt')
          if (el) {
            el.classList.add('highlight-pulse')
            el.focus()
            setTimeout(() => el.classList.remove('highlight-pulse'), 1500)
          }
        })
      } else {
        toast(data.error || '反推失败', 'error')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || '反推失败'
      toast(msg, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleClear = () => {
    setPrompt('')
    setFiles([])
    setGenerating(false)
  }

  const showUpload = mode === 'image' || mode === 'reverse'
  const maxFiles = mode === 'reverse' ? 1 : MAX_FILES
  const isFull = files.length >= maxFiles
  const chipClass = `upload-chip${files.length > 0 ? ' has-files' : ''}${isFull ? ' is-full' : ''}`

  return (
    <article className="composer">
      <div className={`input-card${toolLoading ? ' tool-active' : ''}`}>

        {/* 输入框 + 图片上传 在上 */}
        <label className="sr-only" htmlFor="prompt">提示词</label>
        <div className="prompt-shell">
          <textarea
            id="prompt"
            className={`prompt${showUpload && files.length > 0 ? ' has-upload' : ''}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              mode === 'reverse' ? '（可选）自定义反推指令' :
              mode === 'image' ? '描述你想要的图片效果' :
              '输入一句描述，生成风格明确、细节完整的图片'
            }
          />
          {showUpload && (
            <div className={`thumb-row${files.length > 0 ? ' has-files' : ''}`}>
              <div className="thumbs">
                {files.map((f, i) => (
                  <div
                    key={thumbUrls[i]}
                    className={`thumb${removingIdx === i ? ' removing' : ''}`}
                    onMouseEnter={(e) => handleThumbHover(e, thumbUrls[i])}
                    onMouseLeave={() => setHoverPreview(null)}
                  >
                    <img src={thumbUrls[i]} alt="" />
                    <button type="button" onClick={() => handleRemoveFile(i)} aria-label="移除">×</button>
                  </div>
                ))}
              </div>
              {!isFull && <label className={chipClass}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={mode !== 'reverse'}
                  onChange={handleFileChange}
                  disabled={isFull}
                />
                <span className="upload-symbol" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.333 4.667A1.333 1.333 0 0 1 4.667 3.333h6.666a1.333 1.333 0 0 1 1.334 1.334v6.666a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4.667Z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5.333 10l1.6-1.733a.667.667 0 0 1 .98.014L9.067 9.6l1.053-1.2a.667.667 0 0 1 1 .013L12 9.467" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.667 6.333h2.666M12 5v2.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="6.167" cy="6.167" r=".833" fill="currentColor"/>
                  </svg>
                </span>
                <span className="upload-label">添加图片</span>
                <span className="upload-meta">最多 {maxFiles} 张</span>
              </label>}
            </div>
          )}
        </div>

        {mode !== 'reverse' && (
          <div className="prompt-actions">
            <button
              className="mini-ghost-btn"
              type="button"
              disabled={toolLoading}
              onClick={() => handlePromptTool('optimize')}
            >
              ✦ 提示词优化
            </button>
            <button
              className="mini-ghost-btn"
              type="button"
              disabled={toolLoading}
              onClick={() => handlePromptTool('translate')}
            >
              ⇄ 翻译
            </button>
          </div>
        )}

        {/* 底部工具栏：配置 + 生成按钮 */}
        <div className="toolbar">
          <div className="toolbar-left">
            {mode !== 'reverse' && (
              <div className={`config-wrap${configOpen ? ' open' : ''}`}>
                <button
                  className="config-btn"
                  type="button"
                  onClick={() => setConfigOpen(!configOpen)}
                >
                  {configLabel}
                </button>
                <div className="config-backdrop" onClick={() => setConfigOpen(false)} />
                <div className="config-panel" role="dialog" aria-label="生成设置">
                  <div className="config-panel-handle" />
                  <div className="config-block">
                    <h3 className="config-title">模型</h3>
                    <div className={`segmented cols-${Math.min((config?.models || []).length, 3)}`}>
                      {(config?.models || []).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={model === m.id ? 'active' : ''}
                          onClick={() => setModel(m.id)}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="config-block">
                    <h3 className="config-title">图像质量</h3>
                    <div className="segmented cols-3">
                      {availableQualities.map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={quality === q ? 'active' : ''}
                          onClick={() => setQuality(q)}
                        >
                          {QUALITY_LABELS[q] || q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="config-block">
                    <h3 className="config-title">图片尺寸</h3>
                    <div className="segmented sizes cols-7">
                      {availableSizes.map((s) => {
                        const icon = SIZE_ICONS[s] || { w: 16, h: 16 }
                        return (
                          <button
                            key={s}
                            type="button"
                            className={size === s ? 'active' : ''}
                            onClick={() => setSize(s)}
                          >
                            <span
                              className="size-icon"
                              style={{
                                width: icon.w, height: icon.h,
                                borderRadius: icon.round ? '50%' : 2,
                              }}
                            />
                            <span className="size-label">{s === 'auto' ? '自动' : s}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="config-block">
                    <h3 className="config-title">图片张数</h3>
                    <div className="segmented cols-4">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={count === n ? 'active' : ''}
                          onClick={() => setCount(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="toolbar-right">
            <label className="gallery-toggle">
              <button
                className={`toggle-switch${isPublic ? ' active' : ''}`}
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                aria-label="公开作品"
              />
              <span>公开</span>
            </label>
            <button className="icon-btn" type="button" aria-label="清空" onClick={handleClear}>⟲</button>
            <button
              className={`black-btn${generating ? ' loading' : ''}`}
              type="button"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (mode === 'reverse' ? '反推中' : '生成中') : mode === 'reverse' ? '反推提示词' : `生成 · ${totalCost}积分`}
            </button>
          </div>
        </div>
      </div>

      {hoverPreview && createPortal(
        <div
          className="image-hover-preview show"
          style={{ left: hoverPreview.x - 90, top: hoverPreview.y - 192 }}
        >
          <img src={hoverPreview.url} alt="" />
        </div>,
        document.body
      )}
    </article>
  )
}
