'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useGeneratorStore } from '@/stores/generator'
import { SubPageLayout } from '@/components/layout/SubPageLayout'
import { toast } from '@/components/ui/Toaster'

interface TemplateVar {
  name: string
  type: string
  label: string
  default: string
  description?: string
  alternatives?: string[]
}

interface Template {
  id: number
  title: string
  tags: string
  cover_image?: string
  preview_url?: string
  variables: TemplateVar[]
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selected, setSelected] = useState<Template | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [building, setBuilding] = useState(false)
  const { setPrompt, setMode } = useGeneratorStore()
  const router = useRouter()

  useEffect(() => {
    api.get('/templates', { params: { per_page: 50 } })
      .then(({ data }) => setTemplates(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allTags = Array.from(new Set(
    templates.flatMap((t) => (t.tags || '').split(',').map((s) => s.trim()).filter(Boolean))
  ))

  const filtered = activeTag
    ? templates.filter((t) => t.tags?.includes(activeTag))
    : templates

  const openTemplate = (t: Template) => {
    setSelected(t)
    const init: Record<string, string> = {}
    ;(t.variables || []).forEach((v) => { init[v.name] = v.default || '' })
    setValues(init)
  }

  const handleBuild = async () => {
    if (!selected) return
    setBuilding(true)
    try {
      const { data } = await api.post(`/templates/${selected.id}/build`, { variables: values })
      if (data.prompt) {
        setPrompt(data.prompt)
        setMode('text')
        setSelected(null)
        toast('模板已应用', 'success')
        router.push('/')
      }
    } catch {
      toast('生成失败', 'error')
    } finally {
      setBuilding(false)
    }
  }

  return (
    <SubPageLayout>
      <div className="tpl-hero">
        <div className="tpl-hero-bg" />
        <h1 className="tpl-hero-title">提示词模板</h1>
        <p className="tpl-hero-desc">选择模板 · 填入变量 · 一键生成专业级提示词</p>
        {allTags.length > 0 && (
          <div className="tpl-tags">
            <button
              className={`tpl-tag${!activeTag ? ' active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tpl-tag${activeTag === tag ? ' active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="sub-loading">加载中</div>
      ) : filtered.length === 0 ? (
        <div className="sub-empty">
          <span className="sub-empty-icon">✦</span>
          <span>暂无模板</span>
        </div>
      ) : (
        <div className="tpl-grid">
          {filtered.map((t, idx) => (
            <div
              key={t.id}
              className="tpl-card"
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={() => openTemplate(t)}
            >
              <div className="tpl-card-cover">
                {t.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.cover_image} alt={t.title} loading="lazy" />
                ) : (
                  <div className="tpl-card-placeholder">
                    <span>✧</span>
                  </div>
                )}
                <div className="tpl-card-overlay">
                  <span className="tpl-card-cta">使用模板</span>
                </div>
              </div>
              <div className="tpl-card-body">
                <h3 className="tpl-card-title">{t.title}</h3>
                <div className="tpl-card-meta">
                  <div className="tpl-card-tags">
                    {(t.tags || '').split(',').filter(Boolean).map((tag) => (
                      <span key={tag} className="tpl-card-tag">{tag.trim()}</span>
                    ))}
                  </div>
                  <span className="tpl-card-count">{(t.variables || []).length} 个变量</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="tpl-modal" onClick={() => setSelected(null)}>
          <div className="tpl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tpl-modal-header">
              <div>
                <h2 className="tpl-modal-title">{selected.title}</h2>
                <div className="tpl-modal-tags">
                  {(selected.tags || '').split(',').filter(Boolean).map((tag) => (
                    <span key={tag}>{tag.trim()}</span>
                  ))}
                </div>
              </div>
              <button className="tpl-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="tpl-modal-divider" />
            <div className="tpl-modal-form">
              {(selected.variables || []).map((v, idx) => (
                <div key={v.name} className="tpl-field" style={{ animationDelay: `${idx * 40}ms` }}>
                  <label className="tpl-field-label">
                    <span className="tpl-field-num">{idx + 1}</span>
                    {v.label}
                  </label>
                  {v.description && <p className="tpl-field-desc">{v.description}</p>}
                  <input
                    type="text"
                    className="tpl-field-input"
                    value={values[v.name] || ''}
                    placeholder={v.default}
                    onChange={(e) => setValues({ ...values, [v.name]: e.target.value })}
                  />
                  {v.alternatives && v.alternatives.length > 0 && (
                    <div className="tpl-field-alts">
                      <span className="tpl-field-alts-label">快捷填入</span>
                      {v.alternatives.map((alt) => (
                        <button
                          key={alt}
                          type="button"
                          className={`tpl-alt-btn${values[v.name] === alt ? ' active' : ''}`}
                          onClick={() => setValues({ ...values, [v.name]: alt })}
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="tpl-modal-footer">
              <button
                className="tpl-modal-submit"
                disabled={building}
                onClick={handleBuild}
              >
                {building ? (
                  <span className="tpl-submit-loading">生成中...</span>
                ) : (
                  <>生成提示词并使用</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SubPageLayout>
  )
}
