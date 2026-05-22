'use client'

import { useGeneratorStore } from '@/stores/generator'

const MODES = [
  { key: 'text' as const, title: '图像生成', sub: '全能图像模型' },
  { key: 'image' as const, title: '参考图生成', sub: '支持组图生成' },
  { key: 'reverse' as const, title: '提示词反推', sub: '图片反推提示词' },
]

export function ModeCards() {
  const { mode, setMode } = useGeneratorStore()

  return (
    <div className="mode-cards">
      {MODES.map((m) => (
        <button
          key={m.key}
          className={`mode-card${mode === m.key ? ' active' : ''}`}
          type="button"
          onClick={() => setMode(m.key)}
        >
          <div className="mode-card-title">{m.title}</div>
          <div className="mode-card-sub">{m.sub}</div>
        </button>
      ))}
    </div>
  )
}
